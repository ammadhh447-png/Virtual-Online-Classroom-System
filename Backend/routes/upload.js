const express = require("express");
const router = express.Router();
const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../utils/cloudinary");
const auth = require("../middlewares/auth");

// use memory storage so we can upload directly to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/upload/image - optional auth (for signup without token)
router.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded." });

    const buffer = req.file.buffer;

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "classroom-profiles" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ message: "Upload failed." });
        }
        return res.json({ url: result.secure_url, info: result });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
