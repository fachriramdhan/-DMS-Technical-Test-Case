const express = require("express");
const router = express.Router();
const documentController = require("../controllers/documentController");
const { authenticate } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Semua route document memerlukan autentikasi
router.use(authenticate);

router.post("/", upload.single("file"), documentController.upload);
router.get("/", documentController.getAll);
router.get("/:id", documentController.getById);
router.put(
  "/:id/replace",
  upload.single("file"),
  documentController.requestReplace,
);
router.delete("/:id", documentController.requestDelete);

module.exports = router;
