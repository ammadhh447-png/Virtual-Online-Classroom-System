const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middlewares/auth");
const aiController = require("../controllers/aiController");

const upload = multer({ storage: multer.memoryStorage() });

// Chat endpoint with optional file upload
router.post("/chat", auth, upload.single("file"), aiController.chat);

module.exports = router;
