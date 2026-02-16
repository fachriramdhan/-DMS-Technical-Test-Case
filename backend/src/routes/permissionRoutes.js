const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permissionController");
const { authenticate, authorize } = require("../middlewares/auth");

// Semua route permission hanya bisa diakses oleh ADMIN
router.use(authenticate, authorize("ADMIN"));

router.get("/", permissionController.getAllRequests);
router.put("/:id/approve", permissionController.approve);
router.put("/:id/reject", permissionController.reject);

module.exports = router;
