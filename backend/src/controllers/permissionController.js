const permissionService = require("../services/permissionService");
const { successResponse, errorResponse } = require("../utils/response");

class PermissionController {
  async getAllRequests(req, res) {
    try {
      const { page = 1, limit = 10, status = "PENDING" } = req.query;

      const result = await permissionService.getAllRequests(
        page,
        limit,
        status,
      );

      return successResponse(res, result, "Data request berhasil diambil");
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async approve(req, res) {
    try {
      const { id } = req.params;

      const result = await permissionService.approveRequest(id, req.user.id);

      return successResponse(res, result, "Request berhasil disetujui");
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async reject(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const result = await permissionService.rejectRequest(
        id,
        req.user.id,
        reason,
      );

      return successResponse(res, result, "Request berhasil ditolak");
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new PermissionController();
