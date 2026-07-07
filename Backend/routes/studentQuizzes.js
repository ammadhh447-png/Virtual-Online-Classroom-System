const express = require("express");
const multer = require("multer");
const auth = require("../middlewares/auth");
const studentQuizController = require("../controllers/studentQuizController");

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
router.get("/", auth, studentQuizController.getQuizzesForStudent);
router.get(
  "/:quizId/submission-status",
  auth,
  studentQuizController.getQuizSubmissionStatus,
);
router.post(
  "/submit",
  auth,
  upload.single("file"),
  studentQuizController.submitQuiz,
);
router.get(
  "/:quizId/submissions",
  auth,
  studentQuizController.getQuizSubmissions,
);
router.get(
  "/class/submissions/all",
  auth,
  studentQuizController.getSubmissionsByClass,
);
router.put("/:submissionId/marks", auth, studentQuizController.updateMarks);

module.exports = router;
