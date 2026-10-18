const path = require("path");
const fs = require("fs");
const { Note, VALID_CATEGORIES, VALID_SEMESTERS } = require("../models/Note");
const { uploadPdf } = require("../config/cloudinary");
const { validatePdf } = require("../utils/pdfValidator");
const { isDbConnected } = require("../config/db");

// Fallback demo notes to show on homepage if DB has not been seeded yet or during demo mode


async function getNotes(req, res) {
  try {
    const { category, semester, search, q, page = 1, limit = 9 } = req.query;
    const searchQuery = (search || q || "").trim().toLowerCase();
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 9));

    // If DB is not connected or in demo fallback mode
    if (!isDbConnected()) {
      let filtered = DEFAULT_DEMO_NOTES.filter((n) => n.status === "approved");

      if (category && category !== "All") {
        filtered = filtered.filter((n) => n.category.toLowerCase() === category.toLowerCase());
      }
      if (semester && semester !== "All") {
        filtered = filtered.filter((n) => n.semester.toLowerCase() === semester.toLowerCase());
      }
      if (searchQuery) {
        filtered = filtered.filter((n) => {
          const hay = `${n.title} ${n.subject} ${n.category} ${n.semester} ${n.description} ${n.tags.join(" ")}`.toLowerCase();
          return hay.includes(searchQuery);
        });
      }

      const total = filtered.length;
      const start = (pageNum - 1) * limitNum;
      const paginated = filtered.slice(start, start + limitNum);

      return res.status(200).json({
        success: true,
        isDemo: true,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        count: paginated.length,
        notes: paginated,
      });
    }

    // Build Mongoose filter for approved notes
    const filter = { status: "approved" };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (semester && semester !== "All") {
      filter.semester = semester;
    }

    if (searchQuery) {
      filter.$or = [
        { title: { $regex: searchQuery, $options: "i" } },
        { subject: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
        { tags: { $in: [new RegExp(searchQuery, "i")] } },
      ];
    }

    const total = await Note.countDocuments(filter);
    const notes = await Note.find(filter)
      .populate("uploader", "name college")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // If DB has 0 approved notes yet, provide demo notes so the public site is immediately welcoming and usable
    if (total === 0 && !searchQuery && (!category || category === "All") && (!semester || semester === "All")) {
      return res.status(200).json({
        success: true,
        isDemo: true,
        total: DEFAULT_DEMO_NOTES.length,
        page: 1,
        pages: 1,
        count: DEFAULT_DEMO_NOTES.length,
        notes: DEFAULT_DEMO_NOTES,
      });
    }

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      count: notes.length,
      notes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to fetch study notes.",
    });
  }
}

async function getNoteById(req, res) {
  try {
    const { id } = req.params;

    // Check demo note ID
    const demo = DEFAULT_DEMO_NOTES.find((d) => d._id === id);
    if (demo) {
      return res.status(200).json({ success: true, note: demo });
    }

    if (!isDbConnected()) {
      return res.status(404).json({ success: false, error: "Note not found." });
    }

    const note = await Note.findById(id).populate("uploader", "name college");
    if (!note) {
      return res.status(404).json({ success: false, error: "Note not found." });
    }

    // Access control: if not approved, only uploader or admin may view
    if (note.status !== "approved") {
      const isOwner = req.user && String(note.uploader?._id || note.uploader) === String(req.user._id || req.user.id);
      const isAdmin = req.user && req.user.role === "admin";
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: "Access denied. This note is currently pending review.",
        });
      }
    }

    return res.status(200).json({ success: true, note });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error retrieving note details.",
    });
  }
}

async function createNote(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a PDF file.",
      });
    }

    const { title, subject, category, semester, description, tags } = req.body;

    // Input validation
    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: "Title must be at least 3 characters long.",
      });
    }

    if (!subject || typeof subject !== "string" || subject.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Subject must be at least 2 characters long.",
      });
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    if (!semester || !VALID_SEMESTERS.includes(semester)) {
      return res.status(400).json({
        success: false,
        error: `Semester must be one of: ${VALID_SEMESTERS.join(", ")}`,
      });
    }

    if (!description || typeof description !== "string" || description.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: "Description must be at least 5 characters long.",
      });
    }

    // Strict PDF validation (buffer magic bytes, MIME, extension, size)
    const validation = validatePdf(req.file.buffer, req.file.originalname, req.file.mimetype);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // Upload to Cloudinary (or local storage fallback)
    const storageResult = await uploadPdf(req.file.buffer, req.file.originalname);

    // Process tags
    let parsedTags = [];
    if (typeof tags === "string") {
      parsedTags = tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    } else if (Array.isArray(tags)) {
      parsedTags = tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
    }

    if (!isDbConnected()) {
      return res.status(201).json({
        success: true,
        message: "Note submitted and is pending administrator review.",
        note: {
          title: title.trim(),
          subject: subject.trim(),
          category,
          semester,
          description: description.trim(),
          tags: parsedTags,
          status: "pending",
          ...storageResult,
        },
      });
    }

    const note = await Note.create({
      title: title.trim(),
      subject: subject.trim(),
      category,
      semester,
      description: description.trim(),
      tags: parsedTags,
      uploader: req.user._id || req.user.id,
      status: "pending",
      originalFileName: path.basename(req.file.originalname),
      storageProvider: storageResult.storageProvider,
      storagePublicId: storageResult.storagePublicId,
      secureUrl: storageResult.secureUrl,
      fileSizeBytes: storageResult.fileSizeBytes,
    });

    return res.status(201).json({
      success: true,
      message: "Note uploaded successfully and is pending administrator approval.",
      note,
    });
  } catch (error) {
    console.error("Create note error:", error.message || error);
    return res.status(500).json({
      success: false,
      error: error.message || "Upload failed. Please check file and try again.",
    });
  }
}

async function getMyNotes(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!isDbConnected()) {
      return res.status(200).json({
        success: true,
        total: 0,
        notes: [],
      });
    }

    const notes = await Note.find({ uploader: userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: notes.length,
      notes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve your notes.",
    });
  }
}

async function downloadNote(req, res) {
  try {
    const { id } = req.params;

    // Check demo notes
    const demo = DEFAULT_DEMO_NOTES.find((d) => d._id === id);
    if (demo) {
      return res.status(200).json({
        success: true,
        message: "This is a demonstration note card for the BrainShelf catalogue.",
        note: demo,
      });
    }

    if (!isDbConnected()) {
      return res.status(404).json({ success: false, error: "Note not found." });
    }

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ success: false, error: "Note not found." });
    }

    // Access control: if not approved, only uploader or admin can download
    if (note.status !== "approved") {
      const isOwner = req.user && String(note.uploader) === String(req.user._id || req.user.id);
      const isAdmin = req.user && req.user.role === "admin";
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: "Forbidden. Only approved notes can be downloaded.",
        });
      }
    }

    // If Cloudinary URL, redirect
    if (note.storageProvider === "cloudinary" && note.secureUrl.startsWith("http")) {
      return res.redirect(note.secureUrl);
    }

    // If local fallback file, stream it
    const uploadsDir = path.join(__dirname, "../../uploads");
    const filePath = path.join(uploadsDir, note.storagePublicId);
    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${note.originalFileName || "note.pdf"}"`);
      return fs.createReadStream(filePath).pipe(res);
    }

    return res.status(404).json({
      success: false,
      error: "File asset not found on storage server.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Error processing download.",
    });
  }
}

module.exports = {
  getNotes,
  getNoteById,
  createNote,
  getMyNotes,
  downloadNote,
  DEFAULT_DEMO_NOTES,
};
