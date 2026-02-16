const notificationService = require("../services/notificationService");
const { successResponse, errorResponse } = require("../utils/response");

class NotificationController {
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, isRead } = req.query;
      const userId = req.user.id;

      const readFilter =
        isRead === "true" ? true : isRead === "false" ? false : null;

      const result = await notificationService.getUserNotifications(
        userId,
        page,
        limit,
        readFilter,
      );

      return successResponse(res, result, "Data notifikasi berhasil diambil");
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await notificationService.markAsRead(id, userId);

      return successResponse(res, result, "Notifikasi ditandai sebagai dibaca");
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      const result = await notificationService.markAllAsRead(userId);

      return successResponse(
        res,
        result,
        "Semua notifikasi ditandai sebagai dibaca",
      );
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const result = await notificationService.getUnreadCount(userId);

      return successResponse(res, result, "Jumlah notifikasi belum dibaca");
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await notificationService.deleteNotification(id, userId);

      return successResponse(res, result, "Notifikasi berhasil dihapus");
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }
}

module.exports = new NotificationController();
