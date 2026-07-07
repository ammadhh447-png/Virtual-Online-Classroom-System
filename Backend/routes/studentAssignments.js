const express = require("express");
const multer = require("multer");
const auth = require("../middlewares/auth");
const studentAssignmentController = require("../controllers/studentAssignmentController");

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
router.get("/", auth, studentAssignmentController.getAssignmentsForStudent);
router.get(
  "/:assignmentId/submission-status",
  auth,
  studentAssignmentController.getSubmissionStatus,
);
router.post(
  "/submit",
  auth,
  upload.single("file"),
  studentAssignmentController.submitAssignment,
);
router.get(
  "/:assignmentId/submissions",
  auth,
  studentAssignmentController.getSubmissionsForAssignment,
);
router.get(
  "/class/submissions/all",
  auth,
  studentAssignmentController.getSubmissionsByClass,
);
router.put(
  "/:submissionId/marks",
  auth,
  studentAssignmentController.updateMarks,
);

module.exports = router;
