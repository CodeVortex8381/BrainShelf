const path = require("path");

const MAX_DEFAULT_SIZE_MB = 10;

/**
 * Validates PDF buffer, filename, and mimetype
 * @param {Buffer} buffer
 * @param {string} originalname
 * @param {string} mimetype
 * @param {number} maxMb
 * @returns {{ valid: boolean, error?: string }}
 */
function validatePdf(buffer, originalname, mimetype, maxMb = null) {
  const maxAllowedMb = maxMb || Number(process.env.MAX_PDF_SIZE_MB) || MAX_DEFAULT_SIZE_MB;
  const maxAllowedBytes = maxAllowedMb * 1024 * 1024;

  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "The uploaded file is empty. Please select a valid PDF." };
  }

  if (buffer.length > maxAllowedBytes) {
    return {
      valid: false,
      error: `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum limit of ${maxAllowedMb} MB.`,
    };
  }

  // Check extension
  const ext = path.extname(originalname || "").toLowerCase();
  if (ext !== ".pdf") {
    return {
      valid: false,
      error: "Invalid file type. Only files with the .pdf extension are accepted.",
    };
  }

  // Check MIME type
  if (mimetype && mimetype.toLowerCase() !== "application/pdf") {
    return {
      valid: false,
      error: "Invalid MIME type. Uploaded file must be application/pdf.",
    };
  }

  // Check magic bytes (%PDF -> 0x25, 0x50, 0x44, 0x46)
  if (buffer.length < 4) {
    return {
      valid: false,
      error: "Corrupted file. File header is too short to be a valid PDF.",
    };
  }

  const magicBytes = buffer.toString("utf8", 0, 4);
  if (magicBytes !== "%PDF") {
    return {
      valid: false,
      error: "File signature mismatch. The uploaded file is not a genuine PDF document.",
    };
  }

  return { valid: true };
}

module.exports = {
  validatePdf,
};
