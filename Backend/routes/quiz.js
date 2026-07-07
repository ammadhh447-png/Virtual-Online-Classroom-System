const express = require("express");
const multer = require("multer");
const auth = require("../middlewares/auth");
const quizController = require("../controllers/quizController");

const router = express.Router();

// Multer memory storage configuration
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed"), false);
    }
  },
});

// Routes
router.post("/", auth, upload.single("file"), quizController.createQuiz);
router.get("/", auth, quizController.getQuizzes);
router.get("/:id", auth, quizController.getQuizById);
router.put("/:id", auth, upload.single("file"), quizController.updateQuiz);
router.delete("/:id", auth, quizController.deleteQuiz);

module.exports = router;
