const authService = require("../services/authService");
const { successResponse, errorResponse } = require("../utils/response");

class AuthController {
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;

      // Validasi input
      if (!name || !email || !password) {
        return errorResponse(res, "Semua field wajib diisi", 400);
      }

      // Validasi email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse(res, "Format email tidak valid", 400);
      }

      // Validasi password minimal 6 karakter
      if (password.length < 6) {
        return errorResponse(res, "Password minimal 6 karakter", 400);
      }

      const user = await authService.register({ name, email, password, role });

      return successResponse(res, user, "Registrasi berhasil", 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validasi input
      if (!email || !password) {
        return errorResponse(res, "Email dan password wajib diisi", 400);
      }

      const result = await authService.login(email, password);

      return successResponse(res, result, "Login berhasil");
    } catch (error) {
      return errorResponse(res, error.message, 401);
    }
  }

  async getProfile(req, res) {
    try {
      const user = await authService.getUserById(req.user.id);
      return successResponse(res, user, "Data user berhasil diambil");
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }
}

module.exports = new AuthController();
