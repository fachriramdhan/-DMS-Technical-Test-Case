const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const routes = require("./routes");
const db = require("./config/database");
const redisClient = require("./config/redis");

const app = express();
const PORT = process.env.PORT || 5000;

// ====== CORS CONFIGURATION (SIMPLIFIED) ======
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
// ====== END CORS ======

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded documents)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api", routes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "DMS API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan",
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Terjadi kesalahan pada server",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 DMS Backend Server Running       ║
║   📍 Port: ${PORT}                        ║
║   🌍 Environment: ${process.env.NODE_ENV || "development"}         ║
║   📚 API: http://localhost:${PORT}/api    ║
╚════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing server gracefully...");
  await db.end();
  await redisClient.quit();
  process.exit(0);
});
