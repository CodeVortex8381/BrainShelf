const { verifyToken } = require("../utils/jwt.utils");
const User = require("../models/User");
const { isDbConnected } = require("../config/db");

async function authenticateUser(req, res, next) {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Please log in.",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired session. Please log in again.",
    });
  }

  try {
    if (isDbConnected()) {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Account not found or has been deactivated.",
        });
      }
      req.user = user;
    } else {
      // Mock / fallback user object if DB offline in test mode
      req.user = {
        _id: decoded.userId,
        id: decoded.userId,
        name: decoded.name || "User",
        email: decoded.email || "user@example.com",
        role: decoded.role || "student",
      };
    }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Authentication failed.",
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Forbidden. Administrator privileges required.",
    });
  }
  next();
}

async function optionalAuth(req, res, next) {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next();
  }

  const decoded = verifyToken(token);
  if (decoded && decoded.userId) {
    if (isDbConnected()) {
      try {
        const user = await User.findById(decoded.userId);
        if (user) req.user = user;
      } catch (e) {
        // Ignore in optional
      }
    } else {
      req.user = {
        _id: decoded.userId,
        id: decoded.userId,
        role: decoded.role || "student",
      };
    }
  }
  next();
}

module.exports = {
  authenticateUser,
  requireAdmin,
  optionalAuth,
};
