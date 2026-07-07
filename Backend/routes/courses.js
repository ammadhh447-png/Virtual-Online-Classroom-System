const express = require("express");
const router = express.Router();
const Course = require("../models/Courses");
const auth = require("../middlewares/auth");

// Get all courses for the logged-in teacher
router.get("/", auth, async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user.id });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
