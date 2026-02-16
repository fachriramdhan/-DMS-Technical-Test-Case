const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticate } = require("../middlewares/auth");

// Semua route notification memerlukan autentikasi
router.use(authenticate);

router.get("/", notificationController.getAll);
router.get("/unread-count", notificationController.getUnreadCount);
router.put("/mark-all-read", notificationController.markAllAsRead);
router.put("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.delete);

module.exports = router;
