const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: false,
      index: true,
    },
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: false,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    year: { type: String, required: true, uppercase: true, trim: true },
    department: { type: String, required: true, uppercase: true, trim: true },
    section: { type: String, required: true, uppercase: true, trim: true },
  },
  { timestamps: true },
);

attendanceRecordSchema.index(
  { course: 1, student: 1, date: 1 },
  { unique: true },
);

module.exports = mongoose.model("AttendanceRecord", attendanceRecordSchema);
