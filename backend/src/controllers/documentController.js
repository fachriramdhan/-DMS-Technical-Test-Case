const documentService = require("../services/documentService");
const { successResponse, errorResponse } = require("../utils/response");

class DocumentController {
  async upload(req, res) {
    try {
      if (!req.file) {
        return errorResponse(res, "File tidak ditemukan", 400);
      }

      const { title, description, documentType } = req.body;

      if (!title) {
        return errorResponse(res, "Title wajib diisi", 400);
      }

      const document = await documentService.createDocument(
        { title, description, documentType },
        req.file,
        req.user.id,
      );

      return successResponse(res, document, "Dokumen berhasil diupload", 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status = "ACTIVE",
      } = req.query;

      const result = await documentService.getAllDocuments(
        page,
        limit,
        search,
        status,
      );

      return successResponse(res, result, "Data dokumen berhasil diambil");
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const document = await documentService.getDocumentById(id);

      return successResponse(res, document, "Detail dokumen berhasil diambil");
    } catch (error) {
      return errorResponse(res, error.message, 404);
    }
  }

  async requestReplace(req, res) {
    try {
      if (!req.file) {
        return errorResponse(res, "File baru tidak ditemukan", 400);
      }

      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return errorResponse(res, "Alasan wajib diisi", 400);
      }

      const result = await documentService.requestReplaceDocument(
        id,
        req.file,
        reason,
        req.user.id,
      );

      return successResponse(
        res,
        result,
        "Permintaan ganti dokumen berhasil dibuat",
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async requestDelete(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return errorResponse(res, "Alasan wajib diisi", 400);
      }

      const result = await documentService.requestDeleteDocument(
        id,
        reason,
        req.user.id,
      );

      return successResponse(
        res,
        result,
        "Permintaan hapus dokumen berhasil dibuat",
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }
}

module.exports = new DocumentController();
