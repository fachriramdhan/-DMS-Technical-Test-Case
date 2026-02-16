const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const documentRoutes = require("./documentRoutes");
const permissionRoutes = require("./permissionRoutes");
const notificationRoutes = require("./notificationRoutes");

router.use("/auth", authRoutes);
router.use("/documents", documentRoutes);
router.use("/permissions", permissionRoutes);
router.use("/notifications", notificationRoutes);

module.exports = router;
