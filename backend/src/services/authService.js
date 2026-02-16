const bcrypt = require("bcrypt");
const db = require("../config/database");
const { generateToken } = require("../utils/jwt");

class AuthService {
  async register(userData) {
    const { name, email, password, role = "USER" } = userData;

    // Cek apakah email sudah terdaftar
    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUser.length > 0) {
      throw new Error("Email sudah terdaftar");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user baru
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role],
    );

    return {
      id: result.insertId,
      name,
      email,
      role,
    };
  }

  async login(email, password) {
    // Cari user berdasarkan email
    const [users] = await db.query(
      "SELECT id, name, email, password, role FROM users WHERE email = ?",
      [email],
    );

    if (users.length === 0) {
      throw new Error("Email atau password salah");
    }

    const user = users[0];

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error("Email atau password salah");
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getUserById(userId) {
    const [users] = await db.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      throw new Error("User tidak ditemukan");
    }

    return users[0];
  }
}

module.exports = new AuthService();
