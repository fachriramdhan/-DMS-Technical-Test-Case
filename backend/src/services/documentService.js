const db = require("../config/database");
const fs = require("fs").promises;
const path = require("path");

class DocumentService {
  async createDocument(documentData, file, userId) {
    const { title, description, documentType } = documentData;

    const [result] = await db.query(
      `INSERT INTO documents 
            (title, description, document_type, file_url, file_name, file_size, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        documentType,
        file.filename,
        file.originalname,
        file.size,
        userId,
      ],
    );

    return {
      id: result.insertId,
      title,
      description,
      documentType,
      fileName: file.originalname,
      fileSize: file.size,
    };
  }

  async getAllDocuments(page = 1, limit = 10, search = "", status = "ACTIVE") {
    const offset = (page - 1) * limit;

    let query = `
            SELECT d.*, u.name as creator_name, u.email as creator_email
            FROM documents d
            JOIN users u ON d.created_by = u.id
            WHERE d.status = ?
        `;
    const params = [status];

    if (search) {
      query += ` AND (d.title LIKE ? OR d.description LIKE ? OR d.document_type LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY d.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [documents] = await db.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM documents WHERE status = ?`;
    const countParams = [status];

    if (search) {
      countQuery += ` AND (title LIKE ? OR description LIKE ? OR document_type LIKE ?)`;
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    return {
      documents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  async getDocumentById(documentId) {
    const [documents] = await db.query(
      `SELECT d.*, u.name as creator_name, u.email as creator_email
            FROM documents d
            JOIN users u ON d.created_by = u.id
            WHERE d.id = ?`,
      [documentId],
    );

    if (documents.length === 0) {
      throw new Error("Dokumen tidak ditemukan");
    }

    return documents[0];
  }

  async requestReplaceDocument(documentId, file, reason, userId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Cek dokumen
      const [documents] = await connection.query(
        'SELECT * FROM documents WHERE id = ? AND status = "ACTIVE"',
        [documentId],
      );

      if (documents.length === 0) {
        throw new Error("Dokumen tidak ditemukan atau sudah tidak aktif");
      }

      // Update status dokumen
      await connection.query(
        'UPDATE documents SET status = "PENDING_REPLACE" WHERE id = ?',
        [documentId],
      );

      // Buat permission request
      const [requestResult] = await connection.query(
        `INSERT INTO permission_requests 
                (document_id, requested_by, action_type, reason, new_file_url) 
                VALUES (?, ?, 'REPLACE', ?, ?)`,
        [documentId, userId, reason, file.filename],
      );

      // Buat notifikasi untuk admin
      const [admins] = await connection.query(
        'SELECT id FROM users WHERE role = "ADMIN"',
      );

      for (const admin of admins) {
        await connection.query(
          `INSERT INTO notifications 
                    (user_id, title, message, type, related_request_id) 
                    VALUES (?, ?, ?, 'REQUEST', ?)`,
          [
            admin.id,
            "Permintaan Ganti Dokumen",
            `User meminta untuk mengganti dokumen "${documents[0].title}"`,
            requestResult.insertId,
          ],
        );
      }

      await connection.commit();
      return { requestId: requestResult.insertId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async requestDeleteDocument(documentId, reason, userId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Cek dokumen
      const [documents] = await connection.query(
        'SELECT * FROM documents WHERE id = ? AND status = "ACTIVE"',
        [documentId],
      );

      if (documents.length === 0) {
        throw new Error("Dokumen tidak ditemukan atau sudah tidak aktif");
      }

      // Update status dokumen
      await connection.query(
        'UPDATE documents SET status = "PENDING_DELETE" WHERE id = ?',
        [documentId],
      );

      // Buat permission request
      const [requestResult] = await connection.query(
        `INSERT INTO permission_requests 
                (document_id, requested_by, action_type, reason) 
                VALUES (?, ?, 'DELETE', ?)`,
        [documentId, userId, reason],
      );

      // Buat notifikasi untuk admin
      const [admins] = await connection.query(
        'SELECT id FROM users WHERE role = "ADMIN"',
      );

      for (const admin of admins) {
        await connection.query(
          `INSERT INTO notifications 
                    (user_id, title, message, type, related_request_id) 
                    VALUES (?, ?, ?, 'REQUEST', ?)`,
          [
            admin.id,
            "Permintaan Hapus Dokumen",
            `User meminta untuk menghapus dokumen "${documents[0].title}"`,
            requestResult.insertId,
          ],
        );
      }

      await connection.commit();
      return { requestId: requestResult.insertId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteFile(filename) {
    try {
      const filePath = path.join(__dirname, "../uploads", filename);
      await fs.unlink(filePath);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }
}

module.exports = new DocumentService();
