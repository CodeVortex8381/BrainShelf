const { Note, VALID_STATUSES } = require("../models/Note");
const User = require("../models/User");
const { deletePdf } = require("../config/cloudinary");
const { isDbConnected } = require("../config/db");

async function getAdminNotes(req, res) {
  try {
    const { status = "pending", page = 1, limit = 20 } = req.query;

    if (!isDbConnected()) {
      return res.status(200).json({
        success: true,
        total: 0,
        notes: [],
      });
    }

    const filter = {};
    if (status && VALID_STATUSES.includes(status)) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

    const total = await Note.countDocuments(filter);
    const notes = await Note.find(filter)
      .populate("uploader", "name email college")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      notes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve notes for review.",
    });
  }
}

async function reviewNote(req, res) {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Action must be either 'approve' or 'reject'.",
      });
    }

    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: "Database unavailable.",
      });
    }

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({
        success: false,
        error: "Note not found.",
      });
    }

    if (action === "approve") {
      note.status = "approved";
      note.rejectionReason = "";
      note.reviewedBy = req.user._id || req.user.id;
      note.reviewedAt = new Date();
    } else {
      note.status = "rejected";
      note.rejectionReason = rejectionReason ? rejectionReason.trim() : "Does not meet community guidelines.";
      note.reviewedBy = req.user._id || req.user.id;
      note.reviewedAt = new Date();
    }

    await note.save();

    return res.status(200).json({
      success: true,
      message: `Note successfully ${note.status}.`,
      note,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to review note.",
    });
  }
}

async function deleteNote(req, res) {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: "Database unavailable.",
      });
    }

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({
        success: false,
        error: "Note not found.",
      });
    }

    // Safe storage cleanup
    if (note.storagePublicId) {
      try {
        await deletePdf(note.storagePublicId, note.storageProvider);
      } catch (storageErr) {
        console.error("Storage cleanup error (non-fatal):", storageErr.message);
      }
    }

    await Note.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully and storage cleaned up.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to delete note.",
    });
  }
}

async function getStats(req, res) {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({
        success: true,
        stats: {
          totalUsers: 0,
          pendingNotes: 0,
          approvedNotes: 0,
          rejectedNotes: 0,
        },
      });
    }

    const [totalUsers, pendingNotes, approvedNotes, rejectedNotes] = await Promise.all([
      User.countDocuments(),
      Note.countDocuments({ status: "pending" }),
      Note.countDocuments({ status: "approved" }),
      Note.countDocuments({ status: "rejected" }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        pendingNotes,
        approvedNotes,
        rejectedNotes,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve platform statistics.",
    });
  }
}

module.exports = {
  getAdminNotes,
  reviewNote,
  deleteNote,
  getStats,
};
