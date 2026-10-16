const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { authenticateUser, requireAdmin } = require("../middleware/auth.middleware");

// Enforce both authentication and administrator authorization
router.use(authenticateUser, requireAdmin);

router.get("/notes", adminController.getAdminNotes);
router.patch("/notes/:id/review", adminController.reviewNote);
router.delete("/notes/:id", adminController.deleteNote);
router.get("/stats", adminController.getStats);

module.exports = router;
