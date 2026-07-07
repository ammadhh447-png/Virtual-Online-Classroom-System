const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const {
  createMeeting,
  getTeacherMeetings,
  getStudentMeetings,
  getAdminMeetings,
  updateMeetingStatus,
  deleteMeeting,
} = require("../controllers/meetingController");

router.post("/", auth, createMeeting);
router.get("/my", auth, getTeacherMeetings);
router.get("/student", auth, getStudentMeetings);
router.get("/admin", auth, getAdminMeetings);
router.patch("/:id/status", auth, updateMeetingStatus);
router.delete("/:id", auth, deleteMeeting);

module.exports = router;
