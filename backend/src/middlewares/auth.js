const { verifyToken } = require("../utils/jwt");
const { errorResponse } = require("../utils/response");

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return errorResponse(res, "Token tidak ditemukan", 401);
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return errorResponse(res, "Token tidak valid atau sudah expired", 401);
    }

    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, "Autentikasi gagal", 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, "Unauthorized", 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, "Anda tidak memiliki akses", 403);
    }

    next();
  };
};

module.exports = { authenticate, authorize };
