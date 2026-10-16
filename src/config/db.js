const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes("replace_with")) {
    console.warn("⚠️ [DB] MONGODB_URI is not configured in .env. Database operations will be mocked or return service unavailable.");
    isConnected = false;
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ [DB] Connected to MongoDB: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.error(`❌ [DB] Connection error: ${error.message}`);
    return false;
  }
}

mongoose.connection.on("connected", () => {
  isConnected = true;
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
});

mongoose.connection.on("error", (err) => {
  isConnected = false;
  console.error("❌ [DB] Mongoose event error:", err.message);
});

function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  isDbConnected,
};
