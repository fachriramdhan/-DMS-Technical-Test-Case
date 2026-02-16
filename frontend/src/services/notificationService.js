import api from "./api";

const notificationService = {
  // Get all notifications
  getAll: async (page = 1, limit = 20, isRead = null) => {
    const params = { page, limit };
    if (isRead !== null) {
      params.isRead = isRead;
    }
    const response = await api.get("/notifications", { params });
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },

  // Mark as read
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.put("/notifications/mark-all-read");
    return response.data;
  },

  // Delete notification
  delete: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

export default notificationService;
