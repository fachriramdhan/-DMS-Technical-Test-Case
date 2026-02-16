# JAWABAN PERTANYAAN DESAIN SISTEM

- **Nama:** Fachri Ramdhan Al Mubaroq
- **Technical Test:** Document Management System (DMS)  
- **Tanggal:** 16 Februari 2026

---

## Pengantar

Dalam dokumen ini, saya akan menjawab 5 pertanyaan desain sistem yang diberikan. Jawaban saya berdasarkan pengalaman yang saya terapkan dalam membangun aplikasi DMS ini, serta best practices yang saya pelajari selama ini.

---

## 1. Bagaimana strategi Anda menangani unggahan file berukuran besar?

### Pendekatan Saat Ini

Di implementasi DMS yang saya buat, saya menggunakan Multer dengan batasan 10MB per file. Ini cukup untuk kebutuhan dokumen standar seperti PDF, Word, atau Excel. Namun saya menyadari bahwa untuk kasus real-world, kita sering butuh handle file yang lebih besar.

```javascript
// Ini implementasi saya saat ini
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter,
});
```

### Strategi untuk File Besar

Kalau saya harus handle file yang lebih besar (misalnya video, backup database, atau file CAD), ada beberapa strategi yang akan saya implementasikan:

#### 1.1 Chunked Upload - Upload Bertahap

Ide dasarnya adalah memecah file besar menjadi potongan-potongan kecil (chunks). Ini mirip seperti download file besar yang bisa di-pause dan resume.

**Kenapa saya pilih ini:**

- User bisa pause dan resume upload
- Kalau koneksi putus, tidak perlu upload ulang dari awal
- Progress bar yang akurat
- Mengurangi beban memory server

**Cara implementasinya:**

Saya akan pakai library seperti **resumable.js** atau **tus protocol**. Flownya seperti ini:

```
1. Frontend split file jadi chunks (misal 5MB per chunk)
2. Upload chunk satu per satu ke backend
3. Backend simpan di temporary folder
4. Track progress pakai Redis
5. Setelah semua chunks terupload, gabungkan jadi file utuh
6. Move ke permanent storage
7. Hapus temporary chunks
```

Contoh kode yang akan saya buat:

```javascript
// Endpoint untuk terima chunks
router.post("/upload-chunk", authenticate, async (req, res) => {
  const { uploadId, chunkIndex, totalChunks } = req.body;
  const chunk = req.file;

  // Simpan chunk ke temporary folder
  const chunkPath = path.join(TEMP_DIR, `${uploadId}_chunk_${chunkIndex}`);
  await fs.rename(chunk.path, chunkPath);

  // Update progress di Redis
  await redis.sadd(`upload:${uploadId}:chunks`, chunkIndex);
  const uploadedChunks = await redis.scard(`upload:${uploadId}:chunks`);

  // Kalau semua chunk sudah diterima, gabungkan
  if (uploadedChunks === totalChunks) {
    const finalPath = await mergeChunks(uploadId, totalChunks);

    // Clean up
    await redis.del(`upload:${uploadId}:chunks`);

    return res.json({
      status: "complete",
      fileUrl: finalPath,
    });
  }

  res.json({
    status: "progress",
    uploaded: uploadedChunks,
    total: totalChunks,
  });
});

// Function untuk gabungkan chunks
async function mergeChunks(uploadId, totalChunks) {
  const finalPath = path.join(UPLOAD_DIR, `${uploadId}_final`);
  const writeStream = fs.createWriteStream(finalPath);

  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(TEMP_DIR, `${uploadId}_chunk_${i}`);
    const chunkData = await fs.readFile(chunkPath);
    writeStream.write(chunkData);
    await fs.unlink(chunkPath); // Hapus chunk setelah digabung
  }

  writeStream.end();
  return finalPath;
}
```

#### 1.2 Direct Upload ke Cloud Storage

Strategi kedua yang menurut saya lebih scalable adalah upload langsung ke cloud storage seperti AWS S3 atau Google Cloud Storage.

**Keuntungan pendekatan ini:**

- Backend server saya tidak handle file binary sama sekali
- Bandwidth server tidak terpakai untuk upload
- Leverage infrastruktur cloud yang sudah proven scalable
- Built-in CDN untuk download yang cepat

**Cara kerjanya:**

```
1. User request presigned URL dari backend saya
2. Backend generate presigned URL (valid 15 menit)
3. User upload langsung ke S3 pakai presigned URL
4. Setelah success, user notify backend
5. Backend save metadata ke database
```

Ini contoh kode yang akan saya implementasikan:

```javascript
// Generate presigned URL
router.post("/generate-upload-url", authenticate, async (req, res) => {
  const { fileName, fileType, fileSize } = req.body;

  // Validasi dulu
  if (fileSize > 100 * 1024 * 1024) {
    // 100MB
    return res.status(400).json({
      error: "File terlalu besar. Maksimal 100MB",
    });
  }

  // Generate unique key
  const key = `documents/${req.user.id}/${Date.now()}-${fileName}`;

  // Buat presigned URL (valid 15 menit)
  const presignedUrl = await s3.getSignedUrlPromise("putObject", {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Expires: 900, // 15 menit
    ContentType: fileType,
    // Security: hanya user ini yang bisa upload
    Metadata: {
      uploadedBy: req.user.id.toString(),
    },
  });

  res.json({
    uploadUrl: presignedUrl,
    key: key,
  });
});

// Endpoint konfirmasi setelah upload selesai
router.post("/confirm-upload", authenticate, async (req, res) => {
  const { key, title, description, documentType } = req.body;

  // Verifikasi file benar-benar ada di S3
  const exists = await s3
    .headObject({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    })
    .promise();

  if (!exists) {
    return res.status(400).json({ error: "File tidak ditemukan" });
  }

  // Simpan metadata ke database
  const [result] = await db.query(
    `INSERT INTO documents (title, description, document_type, file_url, created_by) 
     VALUES (?, ?, ?, ?, ?)`,
    [title, description, documentType, key, req.user.id],
  );

  res.json({
    success: true,
    documentId: result.insertId,
  });
});
```

#### 1.3 Background Processing dengan Queue

Untuk file besar, proses seperti virus scanning atau thumbnail generation bisa lama. Saya akan pakai queue system supaya user tidak perlu tunggu.

**Yang akan saya implementasikan:**

- Pakai Redis Bull untuk job queue
- Worker process di background
- Tasks: virus scan, metadata extraction, thumbnail generation
- User dapat notifikasi setelah processing selesai

Contoh implementasinya:

```javascript
const Queue = require("bull");
const documentQueue = new Queue("document-processing", {
  redis: {
    host: process.env.REDIS_HOST,
    port: 6379,
  },
});

// Setelah file diupload, add job ke queue
router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    const file = req.file;

    // Simpan ke database dengan status PROCESSING
    const [result] = await db.query(
      "INSERT INTO documents (title, file_url, status, created_by) VALUES (?, ?, ?, ?)",
      [req.body.title, file.filename, "PROCESSING", req.user.id],
    );

    // Add ke queue untuk background processing
    await documentQueue.add("process", {
      documentId: result.insertId,
      filePath: file.path,
      userId: req.user.id,
    });

    // Response langsung ke user (tidak tunggu processing)
    res.json({
      success: true,
      documentId: result.insertId,
      status: "PROCESSING",
      message:
        "File sedang diproses. Anda akan menerima notifikasi setelah selesai.",
    });
  },
);

// Worker untuk process file
documentQueue.process("process", async (job) => {
  const { documentId, filePath, userId } = job.data;

  try {
    // 1. Virus scan
    console.log(`Scanning file for viruses...`);
    const scanResult = await virusScan(filePath);
    if (!scanResult.clean) {
      throw new Error("File terdeteksi mengandung virus!");
    }

    // 2. Extract metadata (untuk PDF, gambar, dll)
    console.log(`Extracting metadata...`);
    const metadata = await extractMetadata(filePath);

    // 3. Generate thumbnail kalau file adalah gambar/PDF
    console.log(`Generating thumbnail...`);
    const thumbnailPath = await generateThumbnail(filePath);

    // Update database
    await db.query(
      `UPDATE documents 
       SET status = 'ACTIVE', metadata = ?, thumbnail = ?
       WHERE id = ?`,
      [JSON.stringify(metadata), thumbnailPath, documentId],
    );

    // Kirim notifikasi ke user
    await notificationService.create({
      userId: userId,
      title: "Document Processing Complete",
      message: "File Anda sudah siap digunakan",
      type: "SUCCESS",
    });
  } catch (error) {
    console.error("Processing error:", error);

    // Update status jadi FAILED
    await db.query("UPDATE documents SET status = ? WHERE id = ?", [
      "FAILED",
      documentId,
    ]);

    // Notify user tentang error
    await notificationService.create({
      userId: userId,
      title: "Document Processing Failed",
      message: error.message,
      type: "ERROR",
    });
  }
});
```

**Kesimpulan strategi saya:**

- Untuk file < 10MB: implementasi saat ini sudah cukup
- Untuk file 10-100MB: gunakan chunked upload
- Untuk file > 100MB: direct upload ke cloud storage
- Semua file: pakai background processing untuk virus scan dan thumbnail

---

## 2. Bagaimana mencegah race condition/lost updates saat mengganti dokumen?

Race condition adalah masalah yang saya aware dari awal development, karena sistem ini multi-user. Saya tidak mau ada kasus dimana dua user replace dokumen yang sama secara bersamaan dan salah satu perubahan hilang.

### Strategi yang Saya Implementasikan

#### 2.1 Database Transaction (Sudah Saya Implementasikan)

Di kode saya saat ini, saya sudah pakai MySQL transaction untuk semua operasi replace dan delete:

```javascript
async requestReplaceDocument(documentId, file, reason, userId) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Lock row dengan SELECT FOR UPDATE
    const [documents] = await connection.query(
      'SELECT * FROM documents WHERE id = ? FOR UPDATE',
      [documentId]
    );

    if (documents.length === 0) {
      throw new Error('Dokumen tidak ditemukan');
    }

    // Cek status - kalau bukan ACTIVE, berarti sedang di-process
    if (documents[0].status !== 'ACTIVE') {
      throw new Error('Dokumen sedang dalam proses. Silakan coba lagi nanti.');
    }

    // Update status jadi PENDING_REPLACE (ini effectively "lock" dokumen)
    await connection.query(
      'UPDATE documents SET status = ? WHERE id = ?',
      ['PENDING_REPLACE', documentId]
    );

    // Buat permission request
    await connection.query(
      `INSERT INTO permission_requests
       (document_id, requested_by, action_type, reason, new_file_url)
       VALUES (?, ?, ?, ?, ?)`,
      [documentId, userId, 'REPLACE', reason, file.filename]
    );

    // Commit transaction - semua atau tidak sama sekali
    await connection.commit();

  } catch (error) {
    // Kalau ada error, rollback semua perubahan
    await connection.rollback();
    throw error;
  } finally {
    // Selalu release connection
    connection.release();
  }
}
```

**Kenapa saya yakin ini aman:**

- `SELECT FOR UPDATE` lock row di database level
- Transaction memastikan ACID compliance
- Kalau ada error di tengah jalan, semua di-rollback
- User kedua yang coba replace akan dapat error message yang jelas

#### 2.2 Status-Based Locking (Sudah Implementasi)

Ini sebenarnya implicit lock yang saya buat. Ketika dokumen statusnya jadi `PENDING_REPLACE` atau `PENDING_DELETE`, user lain tidak bisa lakukan operasi apapun pada dokumen tersebut.

```javascript
// Di setiap operasi, saya selalu cek status dulu
if (document.status !== "ACTIVE") {
  throw new Error(
    `Dokumen tidak dapat diubah. Status saat ini: ${document.status}`,
  );
}
```

#### 2.3 Strategi Tambahan: Optimistic Locking

Kalau saya ingin improve lebih lanjut, saya akan tambahkan version number. Ini approach yang saya pelajari dari sistem banking.

**Cara kerjanya:**

```sql
-- Tambah kolom version
ALTER TABLE documents ADD COLUMN version_number INT DEFAULT 1;

-- Setiap update, increment version
UPDATE documents
SET file_url = ?, version_number = version_number + 1
WHERE id = ? AND version_number = ?
```

Kalau `affectedRows = 0`, berarti ada yang sudah update duluan.

```javascript
// Implementation yang akan saya tambahkan
async replaceDocumentOptimistic(documentId, newFile, expectedVersion) {
  const [result] = await db.query(
    `UPDATE documents
     SET file_url = ?, version_number = version_number + 1
     WHERE id = ? AND version_number = ?`,
    [newFile, documentId, expectedVersion]
  );

  if (result.affectedRows === 0) {
    // Version mismatch = ada concurrent update
    throw new Error(
      'Dokumen telah diubah oleh user lain. Silakan refresh halaman dan coba lagi.'
    );
  }

  return { success: true, newVersion: expectedVersion + 1 };
}
```

#### 2.4 Distributed Lock dengan Redis (untuk Horizontal Scaling)

Kalau aplikasi saya scale jadi multiple server instances, saya akan pakai Redis untuk distributed locking. Ini pakai pattern yang namanya Redlock.

```javascript
const Redlock = require('redlock');

async requestReplaceDocument(documentId, file, reason, userId) {
  const lockKey = `lock:document:${documentId}`;
  let lock;

  try {
    // Try acquire lock (timeout 30 detik)
    lock = await redlock.lock(lockKey, 30000);

    // Lakukan operasi replace
    await this.performReplaceOperation(documentId, file, reason, userId);

  } catch (error) {
    if (error.name === 'LockError') {
      throw new Error(
        'Dokumen sedang diproses oleh user lain. Silakan tunggu sebentar.'
      );
    }
    throw error;
  } finally {
    // Release lock
    if (lock) {
      await lock.unlock();
    }
  }
}
```

**Kesimpulan pendekatan saya:**

- Layer 1: Database transaction dengan row locking ✅ (sudah implementasi)
- Layer 2: Status-based locking ✅ (sudah implementasi)
- Layer 3: Optimistic locking dengan version (future improvement)
- Layer 4: Distributed lock dengan Redis (untuk horizontal scaling)

Saya yakin kombinasi layer 1 dan 2 sudah cukup untuk mencegah race condition dalam sistem ini.

---

## 3. Bagaimana merancang sistem notifikasi yang scalable dengan Redis?

Sistem notifikasi yang saya buat saat ini sudah cukup fungsional, tapi saya tahu ada ruang untuk improvement dalam hal scalability. Mari saya jelaskan pendekatan saya.

### Implementasi Saat Ini

Di DMS yang saya buat, notifikasi disimpan di MySQL dan di-query setiap kali user buka halaman notifikasi:

```javascript
// Current implementation
const [notifications] = await db.query(
  "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
  [userId],
);
```

Ini work dengan baik untuk ratusan user, tapi saya aware ini bisa jadi bottleneck kalau ada ribuan user.

### Strategi Scalability dengan Redis

#### 3.1 Cache Unread Count

Yang paling sering di-query adalah unread count untuk badge di navbar. Saya akan cache ini di Redis:

```javascript
// Get unread count (cek Redis dulu)
async function getUnreadCount(userId) {
  const cacheKey = `user:${userId}:unread_count`;

  // Try get from Redis
  let count = await redis.get(cacheKey);

  if (count === null) {
    // Cache miss - query database
    const [result] = await db.query(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false",
      [userId],
    );
    count = result[0].count;

    // Store di Redis (TTL 5 menit)
    await redis.setex(cacheKey, 300, count);
  }

  return parseInt(count);
}

// Update cache ketika ada perubahan
async function createNotification(userId, notification) {
  // Save ke database
  await db.query(
    "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
    [userId, notification.title, notification.message],
  );

  // Increment counter di Redis
  const cacheKey = `user:${userId}:unread_count`;
  await redis.incr(cacheKey);
  await redis.expire(cacheKey, 300); // Reset TTL
}

// Mark as read - decrement counter
async function markAsRead(notificationId, userId) {
  await db.query("UPDATE notifications SET is_read = true WHERE id = ?", [
    notificationId,
  ]);

  // Decrement counter
  const cacheKey = `user:${userId}:unread_count`;
  await redis.decr(cacheKey);
}
```

**Keuntungan approach ini:**

- Read query jauh lebih cepat (dari memory)
- Mengurangi beban database
- Auto-expire dengan TTL (prevent stale data)

#### 3.2 Pub/Sub untuk Real-time Notification

Untuk real-time notification, saya akan kombinasikan Redis Pub/Sub dengan WebSocket:

```javascript
// Publisher (Backend)
const redis = require("redis");
const publisher = redis.createClient();

async function notifyUser(userId, notification) {
  // 1. Save to database (persistence)
  await db.query(
    "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
    [userId, notification.title, notification.message, notification.type],
  );

  // 2. Publish to Redis (real-time)
  await publisher.publish(
    `user:${userId}:notifications`,
    JSON.stringify({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: new Date(),
    }),
  );
}
```

```javascript
// Subscriber (WebSocket Server)
const io = require("socket.io")(httpServer);
const subscriber = redis.createClient();

// Subscribe to all user notification channels
subscriber.psubscribe("user:*:notifications");

subscriber.on("pmessage", (pattern, channel, message) => {
  // Extract userId from channel name
  const userId = channel.split(":")[1];
  const notification = JSON.parse(message);

  // Emit ke WebSocket client yang connected
  io.to(`user:${userId}`).emit("notification", notification);
});

// WebSocket connection handling
io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;

  // User join room berdasarkan userId mereka
  socket.join(`user:${userId}`);

  console.log(`User ${userId} connected to notification channel`);
});
```

**Frontend implementation:**

```javascript
// Client-side code
const socket = io("http://localhost:3000", {
  auth: { userId: currentUser.id },
});

socket.on("notification", (notification) => {
  // Show toast notification
  toast.success(notification.title, {
    description: notification.message,
  });

  // Update unread count badge
  updateUnreadCount();

  // Play sound (optional)
  playNotificationSound();
});
```

#### 3.3 Queue System untuk Notification Delivery

Untuk notification yang lebih kompleks (email, SMS, push notification), saya akan pakai queue:

```javascript
const Queue = require("bull");

const notificationQueue = new Queue("notifications", {
  redis: { host: "localhost", port: 6379 },
});

// Add notification ke queue
async function sendNotification(userId, notification, channels) {
  await notificationQueue.add(
    "send",
    {
      userId,
      notification,
      channels, // ['in-app', 'email', 'push']
    },
    {
      priority: notification.priority || "normal",
      attempts: 3, // Retry 3x kalau gagal
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  );
}

// Worker untuk process notification
notificationQueue.process("send", async (job) => {
  const { userId, notification, channels } = job.data;

  // In-app notification
  if (channels.includes("in-app")) {
    await db.query(
      "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
      [userId, notification.title, notification.message],
    );
  }

  // Email notification
  if (channels.includes("email")) {
    const [user] = await db.query("SELECT email FROM users WHERE id = ?", [
      userId,
    ]);
    await sendEmail(user[0].email, notification.title, notification.message);
  }

  // Push notification (mobile)
  if (channels.includes("push")) {
    await sendPushNotification(userId, notification);
  }

  return { success: true };
});
```

**Monitoring:**

```javascript
// Log successful notifications
notificationQueue.on("completed", (job, result) => {
  console.log(`✅ Notification ${job.id} delivered successfully`);
});

// Log failed notifications
notificationQueue.on("failed", (job, err) => {
  console.error(`❌ Notification ${job.id} failed:`, err.message);
});

// Dashboard untuk monitoring
app.get("/admin/notification-stats", async (req, res) => {
  const stats = {
    waiting: await notificationQueue.getWaitingCount(),
    active: await notificationQueue.getActiveCount(),
    completed: await notificationQueue.getCompletedCount(),
    failed: await notificationQueue.getFailedCount(),
  };

  res.json(stats);
});
```

### Kesimpulan Arsitektur Notification Saya

```
User Action → Backend → 3 Parallel Operations:

1. Database (MySQL)
   └─> Save notification (persistence)

2. Redis Pub/Sub
   └─> Broadcast to WebSocket server
       └─> Push to connected clients (real-time)

3. Queue (Bull)
   └─> Background worker
       ├─> Send email
       ├─> Send push notification
       └─> Send SMS (if needed)
```

**Scalability benefits:**

- Database hanya untuk persistence, tidak untuk real-time
- Redis handle real-time delivery (super fast)
- Queue handle slow operations (email, SMS) tanpa block user
- Horizontal scaling: tambah worker sesuai load
- Fault tolerant: retry mechanism untuk failed notifications

---

## 4. Bagaimana mengamankan akses file agar tidak bisa diakses sembarangan?

Security adalah salah satu concern utama saya dalam membangun DMS ini. Dokumen perusahaan itu sensitif, jadi saya tidak bisa asal-asalan dalam hal security.

### Strategi Keamanan yang Saya Implementasikan

#### 4.1 Storage di Luar Web Root (Sudah Implementasi)

File yang saya upload disimpan di folder `/src/uploads` yang tidak accessible langsung via URL. User hanya bisa download via API endpoint yang sudah saya protect dengan JWT.

```javascript
// File disimpan di sini (tidak accessible via web)
const UPLOAD_DIR = path.join(__dirname, "../uploads");

// Serve file via protected endpoint
router.get("/documents/:id/download", authenticate, async (req, res) => {
  // 1. Verify user authenticated
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 2. Get document
  const [documents] = await db.query("SELECT * FROM documents WHERE id = ?", [
    req.params.id,
  ]);

  if (documents.length === 0) {
    return res.status(404).json({ error: "Document not found" });
  }

  // 3. Check permission
  if (documents[0].created_by !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "No permission to access this file" });
  }

  // 4. Serve file
  const filePath = path.join(UPLOAD_DIR, documents[0].file_url);
  res.download(filePath);
});
```

**Kenapa saya confident ini aman:**

- File tidak bisa diakses via direct URL seperti `http://example.com/uploads/file.pdf`
- Semua akses harus lewat API yang sudah auth check
- Ada permission check berdasarkan ownership dan role

#### 4.2 Token-based Download (Future Improvement)

Untuk keamanan yang lebih advance, saya akan implementasikan temporary download token:

```javascript
// Generate temporary download token
router.get(
  "/documents/:id/generate-download-token",
  authenticate,
  async (req, res) => {
    const documentId = req.params.id;

    // Check permission dulu
    const hasPermission = await checkPermission(req.user.id, documentId);
    if (!hasPermission) {
      return res.status(403).json({ error: "No permission" });
    }

    // Generate token (valid 5 menit, one-time use)
    const token = jwt.sign(
      {
        documentId,
        userId: req.user.id,
        type: "download",
        nonce: crypto.randomBytes(16).toString("hex"), // Prevent replay
      },
      process.env.JWT_SECRET,
      { expiresIn: "5m" },
    );

    // Store token di Redis untuk one-time use check
    await redis.setex(`download-token:${token}`, 300, documentId);

    res.json({
      downloadUrl: `/api/documents/download/${token}`,
      expiresIn: 300, // 5 minutes
    });
  },
);

// Download dengan token
router.get("/documents/download/:token", async (req, res) => {
  try {
    // Verify JWT
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);

    // Check kalau token sudah dipakai (one-time use)
    const exists = await redis.get(`download-token:${req.params.token}`);
    if (!exists) {
      return res.status(403).json({
        error: "Token sudah digunakan atau expired",
      });
    }

    // Delete token (ensure one-time use)
    await redis.del(`download-token:${req.params.token}`);

    // Get file dan serve
    const [documents] = await db.query(
      "SELECT file_url FROM documents WHERE id = ?",
      [decoded.documentId],
    );

    const filePath = path.join(UPLOAD_DIR, documents[0].file_url);
    res.download(filePath);
  } catch (error) {
    res.status(403).json({ error: "Invalid atau expired token" });
  }
});
```

**Keuntungan approach ini:**

- Token short-lived (5 menit)
- One-time use (tidak bisa dipakai 2x)
- Tidak bisa di-share ke user lain (sudah bound ke userId)

#### 4.3 File Encryption (Advanced Security)

Untuk dokumen yang super sensitif, saya akan encrypt file sebelum disimpan:

```javascript
const crypto = require("crypto");

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
const IV_LENGTH = 16;

// Encrypt file before saving
async function encryptFile(inputPath) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

  const input = await fs.readFile(inputPath);
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);

  // Prepend IV to encrypted data
  const result = Buffer.concat([iv, encrypted]);

  // Overwrite original file
  await fs.writeFile(inputPath, result);

  return inputPath;
}

// Decrypt file on download
async function decryptFile(encryptedPath) {
  const data = await fs.readFile(encryptedPath);

  // Extract IV (first 16 bytes)
  const iv = data.slice(0, IV_LENGTH);
  const encrypted = data.slice(IV_LENGTH);

  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted;
}

// Integration dalam upload
router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  async (req, res) => {
    // Encrypt file
    await encryptFile(req.file.path);

    // Save to database
    await db.query(
      "INSERT INTO documents (title, file_url, encrypted, created_by) VALUES (?, ?, ?, ?)",
      [req.body.title, req.file.filename, true, req.user.id],
    );

    res.json({ success: true });
  },
);

// Integration dalam download
router.get("/documents/:id/download", authenticate, async (req, res) => {
  // ... permission check ...

  if (document.encrypted) {
    // Decrypt dan serve
    const decrypted = await decryptFile(filePath);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(decrypted);
  } else {
    // Serve as is
    res.download(filePath);
  }
});
```

**Benefit encryption:**

- File aman even if attacker dapat akses ke server
- Comply dengan regulation seperti GDPR, HIPAA
- Defense-in-depth strategy

#### 4.4 Access Control List (ACL)

Untuk kontrol yang lebih granular, saya akan buat ACL system:

```sql
-- Table untuk per-user permission
CREATE TABLE document_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  user_id INT NOT NULL,
  permission_type ENUM('VIEW', 'DOWNLOAD', 'EDIT', 'DELETE'),
  granted_by INT NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY (document_id, user_id, permission_type)
);
```

```javascript
// Check permission helper
async function checkPermission(userId, documentId, permissionType) {
  // Owner always has all permissions
  const [documents] = await db.query(
    "SELECT created_by FROM documents WHERE id = ?",
    [documentId],
  );

  if (documents[0].created_by === userId) {
    return true;
  }

  // Check ACL
  const [permissions] = await db.query(
    `SELECT * FROM document_permissions 
     WHERE document_id = ? AND user_id = ? AND permission_type = ?`,
    [documentId, userId, permissionType],
  );

  return permissions.length > 0;
}

// Grant permission (admin only)
router.post(
  "/documents/:id/grant",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    const { userId, permissionType } = req.body;

    await db.query(
      `INSERT INTO document_permissions (document_id, user_id, permission_type, granted_by)
     VALUES (?, ?, ?, ?)`,
      [req.params.id, userId, permissionType, req.user.id],
    );

    res.json({ success: true });
  },
);
```

#### 4.5 Audit Logging

Saya juga akan implement audit log untuk track semua file access:

```javascript
async function logFileAccess(userId, documentId, action, ipAddress, userAgent) {
  await db.query(
    `INSERT INTO file_access_log 
     (user_id, document_id, action, ip_address, user_agent, timestamp)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [userId, documentId, action, ipAddress, userAgent],
  );
}

// Dalam download endpoint
router.get("/documents/:id/download", authenticate, async (req, res) => {
  // ... permission check ...

  // Log access
  await logFileAccess(
    req.user.id,
    req.params.id,
    "DOWNLOAD",
    req.ip,
    req.headers["user-agent"],
  );

  // Serve file
  res.download(filePath);
});
```

### Kesimpulan Security Strategy Saya

**Defense in Depth - Multiple Layers:**

1. ✅ **Authentication:** JWT token (sudah implementasi)
2. ✅ **Authorization:** Role-based + ownership check (sudah implementasi)
3. ✅ **Storage Security:** File di luar web root (sudah implementasi)
4. 🔜 **Token-based Access:** Temporary download tokens
5. 🔜 **Encryption:** File encryption at rest
6. 🔜 **ACL:** Granular permission control
7. 🔜 **Audit Logging:** Track all file access

Saya yakin dengan kombinasi layer-layer ini, file di sistem saya aman dari unauthorized access.

---

## 5. Bagaimana struktur kode Anda memudahkan migrasi ke arsitektur microservices?

Ini pertanyaan yang bagus. Sejujurnya, saat mulai develop DMS ini, saya tidak langsung think microservices. Tapi saya pakai prinsip clean architecture yang saya pelajari, dan ternyata ini memudahkan kalau nanti perlu scale ke microservices.

### Arsitektur Saat Ini

Struktur kode yang saya buat:

```
backend/src/
├── controllers/     ← HTTP request/response handling
├── services/        ← Business logic
├── config/          ← Database & Redis connections
├── middlewares/     ← Auth, upload, error handling
├── routes/          ← API route definitions
└── utils/           ← Helper functions
```

Saya apply **3-layer architecture:**

```
Controller Layer
    ↓ (call)
Service Layer
    ↓ (call)
Data Layer (Database)
```

### Kenapa Struktur Ini Mudah di-Extract jadi Microservices

#### 5.1 Clear Separation of Concerns

Setiap layer punya responsibility yang jelas:

**Controllers:** Handle HTTP stuff

```javascript
// authController.js - hanya handle HTTP
class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return successResponse(res, result, "Login berhasil");
    } catch (error) {
      return errorResponse(res, error.message, 401);
    }
  }
}
```

**Services:** Business logic

```javascript
// authService.js - pure business logic, no HTTP
class AuthService {
  async login(email, password) {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) throw new Error("User not found");

    const valid = await bcrypt.compare(password, users[0].password);
    if (!valid) throw new Error("Invalid password");

    const token = generateToken({ id: users[0].id, role: users[0].role });
    return { token, user: users[0] };
  }
}
```

**Benefit:** Service layer bisa di-extract jadi microservice tanpa perlu rewrite logic.

#### 5.2 Domain Boundaries (Bounded Contexts)

Saya organize code berdasarkan domain:

- **Auth domain:** authController, authService
- **Document domain:** documentController, documentService
- **Permission domain:** permissionController, permissionService
- **Notification domain:** notificationController, notificationService

Ini naturally jadi microservices:

```
Monolith (sekarang):
└── Single Express App
    ├── /auth routes
    ├── /documents routes
    ├── /permissions routes
    └── /notifications routes

Microservices (future):
├── Auth Service (port 3001)
│   └── Owns: users table
├── Document Service (port 3002)
│   └── Owns: documents table
├── Permission Service (port 3003)
│   └── Owns: permission_requests table
└── Notification Service (port 3004)
    └── Owns: notifications table
```

#### 5.3 Migration Strategy: Strangler Pattern

Kalau saya harus migrate ke microservices, saya akan pakai **Strangler Pattern** - extract service satu per satu:

**Phase 1:** Extract Auth Service

```
┌─────────────────────┐
│    API Gateway      │
└──────┬──────────────┘
       │
       ├──> Auth Service (new)
       └──> Monolith (rest)
```

**Phase 2:** Extract Document Service

```
┌─────────────────────┐
│    API Gateway      │
└──────┬──────────────┘
       │
       ├──> Auth Service
       ├──> Document Service (new)
       └──> Monolith (rest)
```

**Phase 3:** Complete

```
┌─────────────────────┐
│    API Gateway      │
└──────┬──────────────┘
       │
       ├──> Auth Service
       ├──> Document Service
       ├──> Permission Service
       └──> Notification Service
```

#### 5.4 Event-Driven Communication

Untuk inter-service communication, saya akan pakai event-driven approach dengan RabbitMQ:

```javascript
// Document Service publish event
await publishEvent("document.uploaded", {
  documentId: 123,
  userId: 456,
  title: "Contract.pdf",
});

// Notification Service listen to event
subscribeToEvent("document.uploaded", async (data) => {
  await notifyAdmins({
    title: "New Document Uploaded",
    message: `${data.title} has been uploaded by User ${data.userId}`,
  });
});
```

**Keuntungan:**

- Services loosely coupled
- Easy to add new subscribers
- Resilient (message queue handle failures)

#### 5.5 Database per Service

Setiap service akan punya database sendiri:

```
Auth Service:
└── auth_db
    └── users table

Document Service:
└── document_db
    └── documents table
    └── (cache user info dari Auth Service)

Permission Service:
└── permission_db
    └── permission_requests table

Notification Service:
└── notification_db
    └── notifications table
```

**Trade-off yang saya aware:**

- ✅ Service independence
- ✅ Technology flexibility per service
- ❌ Data duplication (acceptable)
- ❌ Eventual consistency (manageable dengan events)

#### 5.6 Containerization Ready

Setiap service bisa di-dockerize:

```dockerfile
# Dockerfile untuk Document Service
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3002
CMD ["node", "src/server.js"]
```

```yaml
# docker-compose.yml untuk local development
version: "3.8"
services:
  auth-service:
    build: ./services/auth
    ports: ["3001:3001"]

  document-service:
    build: ./services/document
    ports: ["3002:3002"]

  permission-service:
    build: ./services/permission
    ports: ["3003:3003"]

  notification-service:
    build: ./services/notification
    ports: ["3004:3004"]
```

### Kesimpulan

**Kenapa kode saya siap untuk microservices:**

1. ✅ **Clean separation:** Controller, Service, Data layers
2. ✅ **Domain-driven:** Code organized by business domain
3. ✅ **Stateless:** No session storage, semua JWT-based
4. ✅ **Event-ready:** Redis Pub/Sub infrastructure sudah ada
5. ✅ **Dockerizable:** Each service bisa di-containerize

**Migration path yang saya envision:**

```
Week 1-2: Setup API Gateway (Kong/Express Gateway)
Week 3-4: Extract Auth Service
Week 5-6: Extract Document Service
Week 7-8: Extract Permission Service
Week 9-10: Extract Notification Service
Week 11-12: Testing, monitoring, optimization
```

Saya confident struktur kode saya saat ini tidak akan jadi blocker untuk scale ke microservices kalau memang business requirement nya nanti kesana.

---

## Penutup

Dalam membangun DMS ini, saya fokus pada:

1. **Security First:** JWT auth, file protection, access control
2. **Scalability:** Redis caching, queue system, stateless design
3. **Maintainability:** Clean code, separation of concerns
4. **Reliability:** Transaction safety, error handling, audit logging

Saya sadar masih banyak yang bisa di-improve, tapi saya yakin foundation yang saya buat sudah solid untuk scale seiring business growth.

Ada beberapa trade-off yang saya buat (misalnya eventual consistency untuk distributed system), tapi saya think through setiap decision dan punya justification yang jelas kenapa saya pilih approach tertentu.

---

**Fachri Ramdhan Al Mubaroq**
