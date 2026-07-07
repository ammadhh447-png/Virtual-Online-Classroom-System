const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middlewares/auth");
const Lecture = require("../models/Lecture");
const {
  createLecture,
  getLecturesByTeacher,
  deleteLecture,
  getLecturesByClasses,
} = require("../controllers/lectureController");

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

// Teacher routes
router.post("/", auth, upload.single("file"), createLecture);
router.get("/teacher/all", auth, getLecturesByTeacher);
router.delete("/:lectureId", auth, deleteLecture);

// Student routes
router.get("/student/my-lectures", auth, async (req, res) => {
  try {
    const { rollYear, rollDept, section } = req.user;

    if (!rollYear || !rollDept || !section) {
      return res.status(400).json({ message: "Student class information not found." });
    }

    const studentClass = `${rollYear}-${rollDept}-${section}`;

    const lectures = await Lecture.find({
      classes: { $in: [studentClass] },
    }).sort({ createdAt: -1 });

    res.json(lectures);
  } catch (err) {
    console.error("Error fetching lectures:", err);
    res.status(500).json({ message: "Failed to fetch lectures." });
  }
});

router.post("/student/classes", auth, getLecturesByClasses);

module.exports = router;
