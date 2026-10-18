require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const { connectDB, isDbConnected, getDbError } = require("./src/config/db");
const { isCloudinaryConfigured } = require("./src/config/cloudinary");
const errorHandler = require("./src/middleware/errorHandler.middleware");

// Routes
const authRoutes = require("./src/routes/auth.routes");
const notesRoutes = require("./src/routes/notes.routes");
const adminRoutes = require("./src/routes/admin.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Security Headers (configured to allow Google Fonts and Cloudinary assets)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS
const clientOrigin = process.env.CLIENT_ORIGIN || `http://localhost:${PORT}`;
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static Files (Frontend)
app.use(express.static(path.join(__dirname, "public")));
// Local uploads fallback (if used)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Direct page routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "public", "register.html")));
app.get("/upload", (req, res) => res.sendFile(path.join(__dirname, "public", "upload.html")));
app.get("/my-uploads", (req, res) => res.sendFile(path.join(__dirname, "public", "my-uploads.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));

// Ensure MongoDB is connected for API requests (serverless cold start helper)
app.use("/api", async (req, res, next) => {
  if (!isDbConnected()) {
    await connectDB();
  }
  next();
});

// Safe Health Check Endpoint (FR-19, FR-21)
app.get("/api/health", async (req, res) => {
  if (!isDbConnected()) {
    await connectDB();
  }
  const connected = isDbConnected();
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: {
      connected,
      provider: "MongoDB Atlas",
      ...(connected ? {} : { error: getDbError() || "Connection pending or failed" }),
    },
    storage: {
      configured: isCloudinaryConfigured(),
      provider: isCloudinaryConfigured() ? "cloudinary" : "local_fallback",
    },
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/admin", adminRoutes);

// Safe Centralized Error Handler (FR-16, FR-19)
app.use(errorHandler);

// Start server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BrainShelf running at http://localhost:${PORT}`);
  });
}

module.exports = app;
