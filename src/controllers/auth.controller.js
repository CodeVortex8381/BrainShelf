const User = require("../models/User");
const { generateToken, setAuthCookie, clearAuthCookie } = require("../utils/jwt.utils");
const { isDbConnected } = require("../config/db");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function register(req, res) {
  try {
    const { name, email, password, semester, college } = req.body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Full name must be at least 2 characters long.",
      });
    }

    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: "A valid email address is required.",
      });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: "Database service unavailable. Please try again later.",
      });
    }

    // Check duplicate
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "An account with this email address already exists.",
      });
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Create user (strictly force student role)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      semester: semester || "",
      college: college ? college.trim() : "",
      role: "student",
    });

    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        semester: user.semester,
        college: user.college,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: "An account with this email address already exists.",
      });
    }
    return res.status(400).json({
      success: false,
      error: error.message || "Registration failed.",
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Both email and password are required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: "Database service unavailable. Please try again later.",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Generic error to prevent enumeration
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        semester: user.semester,
        college: user.college,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Authentication failed. Please try again.",
    });
  }
}

async function logout(req, res) {
  clearAuthCookie(res);
  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
}

async function getMe(req, res) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Not authenticated.",
    });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id || req.user.id,
      name: req.user.name,
      email: req.user.email,
      semester: req.user.semester || "",
      college: req.user.college || "",
      role: req.user.role,
      createdAt: req.user.createdAt,
    },
  });
}

module.exports = {
  register,
  login,
  logout,
  getMe,
};
