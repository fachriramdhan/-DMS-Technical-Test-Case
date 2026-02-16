const db = require("../config/database");

class NotificationService {
  async getUserNotifications(userId, page = 1, limit = 20, isRead = null) {
    const offset = (page - 1) * limit;

    let query = `
            SELECT n.*, pr.action_type, pr.status as request_status
            FROM notifications n
            LEFT JOIN permission_requests pr ON n.related_request_id = pr.id
            WHERE n.user_id = ?
        `;
    const params = [userId];

    if (isRead !== null) {
      query += ` AND n.is_read = ?`;
      params.push(isRead);
    }

    query += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [notifications] = await db.query(query, params);

    // Get total count
    let countQuery =
      "SELECT COUNT(*) as total FROM notifications WHERE user_id = ?";
    const countParams = [userId];

    if (isRead !== null) {
      countQuery += ` AND is_read = ?`;
      countParams.push(isRead);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    return {
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };
  }

  async markAsRead(notificationId, userId) {
    const [result] = await db.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
      [notificationId, userId],
    );

    if (result.affectedRows === 0) {
      throw new Error("Notifikasi tidak ditemukan");
    }

    return { message: "Notifikasi berhasil ditandai sebagai dibaca" };
  }

  async markAllAsRead(userId) {
    await db.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE",
      [userId],
    );

    return { message: "Semua notifikasi berhasil ditandai sebagai dibaca" };
  }

  async getUnreadCount(userId) {
    const [result] = await db.query(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE",
      [userId],
    );

    return { unreadCount: result[0].count };
  }

  async deleteNotification(notificationId, userId) {
    const [result] = await db.query(
      "DELETE FROM notifications WHERE id = ? AND user_id = ?",
      [notificationId, userId],
    );

    if (result.affectedRows === 0) {
      throw new Error("Notifikasi tidak ditemukan");
    }

    return { message: "Notifikasi berhasil dihapus" };
  }
}

module.exports = new NotificationService();
    