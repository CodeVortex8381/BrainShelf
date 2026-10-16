const multer = require("multer");
const path = require("path");

const MAX_DEFAULT_SIZE_MB = 10;
const maxAllowedMb = Number(process.env.MAX_PDF_SIZE_MB) || MAX_DEFAULT_SIZE_MB;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (ext !== ".pdf") {
    return cb(new Error("Invalid file type. Only .pdf files are accepted."));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: maxAllowedMb * 1024 * 1024,
  },
  fileFilter,
});

module.exports = upload;
