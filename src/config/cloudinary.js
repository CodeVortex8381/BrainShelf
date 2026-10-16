const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// A valid API secret must not be empty, must not contain asterisks (masked UI copy), and must not be a placeholder
const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes("replace") &&
  !process.env.CLOUDINARY_API_SECRET.includes("*")
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log("☁️ [Cloudinary] Configured successfully with valid credentials.");
} else {
  if (process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_SECRET.includes("*")) {
    console.warn("⚠️ [Cloudinary] CLOUDINARY_API_SECRET in .env appears to be masked with asterisks (***). Please copy the unmasked secret from Cloudinary Console. Using local storage fallback.");
  } else {
    console.warn("⚠️ [Cloudinary] Credentials not fully configured. Using local fallback storage.");
  }
}

function isCloudinaryConfigured() {
  return isConfigured;
}

/**
 * Saves a file to local fallback storage
 */
async function saveToLocalFallback(fileBuffer, originalName) {
  const uploadsDir = path.join(__dirname, "../../uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const safeHash = crypto.randomBytes(8).toString("hex");
  const sanitizedName = `${Date.now()}_${safeHash}.pdf`;
  const targetPath = path.join(uploadsDir, sanitizedName);

  await fs.promises.writeFile(targetPath, fileBuffer);

  return {
    storageProvider: "local_fallback",
    storagePublicId: sanitizedName,
    secureUrl: `/uploads/${sanitizedName}`,
    fileSizeBytes: fileBuffer.length,
  };
}

/**
 * Uploads a PDF to Cloudinary with automatic resilient fallback to local storage
 * @param {Buffer} fileBuffer
 * @param {string} originalName
 * @returns {Promise<{ storageProvider: string, storagePublicId: string, secureUrl: string, fileSizeBytes: number }>}
 */
async function uploadPdf(fileBuffer, originalName) {
  const fileSizeBytes = fileBuffer.length;

  if (isConfigured) {
    try {
      const uploadPromise = new Promise((resolve, reject) => {
        const sanitizedBase = path.parse(originalName).name.replace(/[^a-zA-Z0-9_-]/g, "_");
        const publicId = `brainshelf_notes/${Date.now()}_${sanitizedBase}`;

        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            public_id: publicId,
            format: "pdf",
            folder: "brainshelf_notes",
          },
          (error, result) => {
            if (error) {
              console.warn("⚠️ [Cloudinary] Upload stream error:", error.message);
              return reject(error);
            }
            resolve({
              storageProvider: "cloudinary",
              storagePublicId: result.public_id,
              secureUrl: result.secure_url,
              fileSizeBytes: result.bytes || fileSizeBytes,
            });
          }
        );

        uploadStream.end(fileBuffer);
      });

      return await uploadPromise;
    } catch (cloudErr) {
      console.warn(`⚠️ [Cloudinary] Remote upload failed (${cloudErr.message}). Gracefully saving to local storage fallback.`);
      return await saveToLocalFallback(fileBuffer, originalName);
    }
  } else {
    return await saveToLocalFallback(fileBuffer, originalName);
  }
}

/**
 * Deletes a PDF file from storage
 * @param {string} storagePublicId
 * @param {string} storageProvider
 */
async function deletePdf(storagePublicId, storageProvider = "cloudinary") {
  if (storageProvider === "cloudinary" && isConfigured) {
    try {
      await cloudinary.uploader.destroy(storagePublicId, { resource_type: "raw" });
      return true;
    } catch (err) {
      console.error("Failed to delete from Cloudinary:", err.message);
      return false;
    }
  } else {
    try {
      const uploadsDir = path.join(__dirname, "../../uploads");
      const filePath = path.join(uploadsDir, storagePublicId);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return true;
    } catch (err) {
      console.error("Failed to delete local fallback file:", err.message);
      return false;
    }
  }
}

module.exports = {
  isCloudinaryConfigured,
  uploadPdf,
  deletePdf,
};
