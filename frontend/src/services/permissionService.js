import api from "./api";

const permissionService = {
  // Get all permission requests (Admin only)
  getAll: async (page = 1, limit = 10, status = "PENDING") => {
    const response = await api.get("/permissions", {
      params: { page, limit, status },
    });
    return response.data;
  },

  // Approve request (Admin only)
  approve: async (id) => {
    const response = await api.put(`/permissions/${id}/approve`);
    return response.data;
  },

  // Reject request (Admin only)
  reject: async (id, reason) => {
    const response = await api.put(`/permissions/${id}/reject`, { reason });
    return response.data;
  },
};

export default permissionService;
