const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticateUser } = require("../middleware/auth.middleware");

// Public auth routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// Protected auth route
router.get("/me", authenticateUser, authController.getMe);

module.exports = router;
