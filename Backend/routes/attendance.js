const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const auth = require("../middlewares/auth");

// Get students for attendance marking
router.get("/students", auth, attendanceController.getStudentsByClass);

// Get attendance records
router.get("/", auth, attendanceController.getAttendance);

// Mark attendance
router.post("/mark", auth, attendanceController.markAttendance);

// Teacher manual bulk marking (finalize) - locks attendance for the meeting
router.patch("/teacher/manual/bulk", auth, attendanceController.markManualBulk);

// Get student attendance stats
router.get("/stats/:studentId", auth, attendanceController.getAttendanceStats);

// Export attendance as PDF
router.get("/export", auth, attendanceController.exportAttendance);

module.exports = router;
