const { isDbConnected } = require("../config/db");

function checkDbConnection(req, res, next) {
  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      error: "Database service is currently unavailable. Please verify MONGODB_URI in server configuration.",
    });
  }
  next();
}

module.exports = checkDbConnection;
