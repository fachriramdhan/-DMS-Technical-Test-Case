import api from "./api";

const authService = {
  // Register
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    if (response.data.success) {
      const { token, user } = response.data.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Get profile
  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};

export default authService;
