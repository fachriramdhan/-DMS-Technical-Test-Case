const redis = require("redis");
require("dotenv").config();

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

redisClient.connect().catch(console.error);

module.exports = redisClient;
