const express = require("express");
const router = express.Router();
const notesController = require("../controllers/notes.controller");
const { authenticateUser, optionalAuth } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

// Public catalogue listing (with query/category/semester)
router.get("/", notesController.getNotes);

// Student's own notes (protected)
router.get("/mine", authenticateUser, notesController.getMyNotes);

// Note details (optional auth to verify owner/admin for pending items)
router.get("/:id", optionalAuth, notesController.getNoteById);

// Student PDF upload (protected)
router.post("/", authenticateUser, upload.single("pdf"), notesController.createNote);

// Download PDF (optional auth to allow owner/admin to download pending, public for approved)
router.get("/:id/download", optionalAuth, notesController.downloadNote);

module.exports = router;
