const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middlewares/auth");
const {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} = require("../controllers/assignmentController");

// Multer config for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed"), false);
    }
  },
});

// Routes
router.post("/", auth, upload.single("file"), createAssignment);
router.get("/", auth, getAssignments);
router.get("/:id", auth, getAssignmentById);
router.put("/:id", auth, upload.single("file"), updateAssignment);
router.delete("/:id", auth, deleteAssignment);

module.exports = router;
