import api from "./api";

const documentService = {
  // Get all documents
  getAll: async (page = 1, limit = 10, search = "", status = "ACTIVE") => {
    const response = await api.get("/documents", {
      params: { page, limit, search, status },
    });
    return response.data;
  },

  // Get document by ID
  getById: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  // Upload document
  upload: async (formData) => {
    const response = await api.post("/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Request replace document
  requestReplace: async (id, formData) => {
    const response = await api.put(`/documents/${id}/replace`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Request delete document
  requestDelete: async (id, reason) => {
    const response = await api.delete(`/documents/${id}`, {
      data: { reason },
    });
    return response.data;
  },

  // Get file URL
  getFileUrl: (filename) => {
    return `http://localhost:5001/uploads/${filename}`;
  },
};

export default documentService;
