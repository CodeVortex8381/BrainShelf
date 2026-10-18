const mongoose = require("mongoose");

let isConnected = false;
let connectionPromise = null;
let lastError = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes("replace_with")) {
    const msg = "MONGODB_URI is not configured in environment variables.";
    console.warn(`⚠️ [DB] ${msg}`);
    isConnected = false;
    lastError = msg;
    return false;
  }

  if (isDbConnected()) {
    return true;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      lastError = null;
      console.log(`✅ [DB] Connected to MongoDB: ${conn.connection.host}`);
      return true;
    } catch (error) {
      isConnected = false;
      lastError = error.message;
      console.error(`❌ [DB] Connection error: ${error.message}`);
      return false;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

mongoose.connection.on("connected", () => {
  isConnected = true;
  lastError = null;
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
});

mongoose.connection.on("error", (err) => {
  isConnected = false;
  lastError = err.message;
  console.error("❌ [DB] Mongoose event error:", err.message);
});

function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

function getDbError() {
  return lastError;
}

module.exports = {
  connectDB,
  isDbConnected,
  getDbError,
};
