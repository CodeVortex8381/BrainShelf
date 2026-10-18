const mongoose = require("mongoose");

let isConnected = false;
let connectionPromise = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes("replace_with")) {
    console.warn("⚠️ [DB] MONGODB_URI is not configured in .env. Database operations will be mocked or return service unavailable.");
    isConnected = false;
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
      console.log(`✅ [DB] Connected to MongoDB: ${conn.connection.host}`);
      return true;
    } catch (error) {
      isConnected = false;
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
