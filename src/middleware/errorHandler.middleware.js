/**
 * Centralized safe error handling middleware
 * Ensures no stack traces, database URIs, or internal secrets are exposed to the client.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Log error internally for debugging
  console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  // Handle Multer upload errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      const maxMb = process.env.MAX_PDF_SIZE_MB || 10;
      return res.status(413).json({
        success: false,
        error: `File exceeds the maximum allowed size of ${maxMb} MB.`,
      });
    }
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`,
    });
  }

  // Handle file type filter error
  if (err.message && (err.message.includes("Invalid file type") || err.message.includes(".pdf"))) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: messages.join("; ") || "Validation error",
    });
  }

  // Handle Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      success: false,
      error: `An account or record with this ${field} already exists.`,
    });
  }

  // Safe fallback status code
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  // Return clean, safe error message without internal stack traces
  const safeMessage =
    statusCode === 500
      ? "An unexpected internal server error occurred. Please try again later."
      : (err.message || "An error occurred.");

  res.status(statusCode).json({
    success: false,
    error: safeMessage,
  });
}

module.exports = errorHandler;
