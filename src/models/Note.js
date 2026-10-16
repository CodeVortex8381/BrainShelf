const mongoose = require("mongoose");

const VALID_CATEGORIES = [
  "Programming",
  "Database",
  "AI",
  "Web Development",
  "Other",
];

const VALID_SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
  "All Semesters",
];

const VALID_STATUSES = ["pending", "approved", "rejected"];

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      minlength: [2, "Subject must be at least 2 characters long"],
      maxlength: [100, "Subject cannot exceed 100 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: VALID_CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
    },
    semester: {
      type: String,
      required: [true, "Semester is required"],
      enum: {
        values: VALID_SEMESTERS,
        message: "{VALUE} is not a valid semester",
      },
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [5, "Description must be at least 5 characters long"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    tags: {
      type: [String],
      default: [],
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader user reference is required"],
      index: true,
    },
    status: {
      type: String,
      enum: VALID_STATUSES,
      default: "pending",
      index: true,
    },
    rejectionReason: {
      type: String,
      default: "",
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
    },
    storageProvider: {
      type: String,
      enum: ["cloudinary", "local_fallback"],
      default: "cloudinary",
    },
    storagePublicId: {
      type: String,
      required: [true, "Storage public ID is required"],
    },
    secureUrl: {
      type: String,
      required: [true, "Secure file URL is required"],
    },
    fileSizeBytes: {
      type: Number,
      required: [true, "File size in bytes is required"],
    },
    originalFileName: {
      type: String,
      required: [true, "Original file name is required"],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying public approved notes efficiently
NoteSchema.index({ status: 1, category: 1, semester: 1, createdAt: -1 });

// Text index for search
NoteSchema.index(
  { title: "text", subject: "text", description: "text", tags: "text" },
  { weights: { title: 10, subject: 5, tags: 5, description: 1 } }
);

module.exports = {
  Note: mongoose.models.Note || mongoose.model("Note", NoteSchema),
  VALID_CATEGORIES,
  VALID_SEMESTERS,
  VALID_STATUSES,
};
