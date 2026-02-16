const db = require("../config/database");
const documentService = require("./documentService");
const path = require("path");

class PermissionService {
  async getAllRequests(page = 1, limit = 10, status = "PENDING") {
    const offset = (page - 1) * limit;

    const [requests] = await db.query(
      `SELECT pr.*, 
                    d.title as document_title,
                    u.name as requester_name,
                    u.email as requester_email
            FROM permission_requests pr
            JOIN documents d ON pr.document_id = d.id
            JOIN users u ON pr.requested_by = u.id
            WHERE pr.status = ?
            ORDER BY pr.created_at DESC
            LIMIT ? OFFSET ?`,
      [status, parseInt(limit), offset],
    );

    const [countResult] = await db.query(
      "SELECT COUNT(*) as total FROM permission_requests WHERE status = ?",
      [status],
    );

    const total = countResult[0].total;

    return {
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  async approveRequest(requestId, adminId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Get request details
      const [requests] = await connection.query(
        `SELECT pr.*, d.file_url as old_file_url
                FROM permission_requests pr
                JOIN documents d ON pr.document_id = d.id
                WHERE pr.id = ? AND pr.status = 'PENDING'`,
        [requestId],
      );

      if (requests.length === 0) {
        throw new Error("Request tidak ditemukan atau sudah diproses");
      }

      const request = requests[0];

      if (request.action_type === "DELETE") {
        // Delete dokumen
        await connection.query(
          'UPDATE documents SET status = "DELETED" WHERE id = ?',
          [request.document_id],
        );

        // Hapus file fisik
        await documentService.deleteFile(request.old_file_url);
      } else if (request.action_type === "REPLACE") {
        // Replace dokumen
        await connection.query(
          `UPDATE documents 
                    SET file_url = ?, 
                        file_name = ?, 
                        version = version + 1, 
                        status = 'ACTIVE'
                    WHERE id = ?`,
          [request.new_file_url, request.new_file_url, request.document_id],
        );

        // Hapus file lama
        await documentService.deleteFile(request.old_file_url);
      }

      // Update request status
      await connection.query(
        `UPDATE permission_requests 
                SET status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW()
                WHERE id = ?`,
        [adminId, requestId],
      );

      // Kirim notifikasi ke requester
      await connection.query(
        `INSERT INTO notifications 
                (user_id, title, message, type, related_request_id)
                VALUES (?, ?, ?, 'APPROVAL', ?)`,
        [
          request.requested_by,
          "Permintaan Disetujui",
          `Permintaan ${request.action_type} dokumen Anda telah disetujui`,
          requestId,
        ],
      );

      await connection.commit();
      return { message: "Request berhasil disetujui" };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async rejectRequest(requestId, adminId, rejectionReason) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Get request details
      const [requests] = await connection.query(
        'SELECT * FROM permission_requests WHERE id = ? AND status = "PENDING"',
        [requestId],
      );

      if (requests.length === 0) {
        throw new Error("Request tidak ditemukan atau sudah diproses");
      }

      const request = requests[0];

      // Kembalikan status dokumen ke ACTIVE
      await connection.query(
        'UPDATE documents SET status = "ACTIVE" WHERE id = ?',
        [request.document_id],
      );

      // Update request status
      await connection.query(
        `UPDATE permission_requests 
                SET status = 'REJECTED', reviewed_by = ?, reviewed_at = NOW()
                WHERE id = ?`,
        [adminId, requestId],
      );

      // Hapus file baru jika ada (untuk REPLACE)
      if (request.action_type === "REPLACE" && request.new_file_url) {
        await documentService.deleteFile(request.new_file_url);
      }

      // Kirim notifikasi ke requester
      await connection.query(
        `INSERT INTO notifications 
                (user_id, title, message, type, related_request_id)
                VALUES (?, ?, ?, 'REJECTION', ?)`,
        [
          request.requested_by,
          "Permintaan Ditolak",
          `Permintaan ${request.action_type} dokumen Anda ditolak. Alasan: ${rejectionReason || "Tidak disebutkan"}`,
          requestId,
        ],
      );

      await connection.commit();
      return { message: "Request berhasil ditolak" };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new PermissionService();
