const AttendanceRecord = require("../models/AttendanceRecord");
const User = require("../models/User");
const Meeting = require("../models/Meeting");

// Get students by class filters: ?year=2024&department=CS&section=A
exports.getStudentsByClass = async (req, res) => {
  try {
    const { year, department, section } = req.query;
    const query = { role: "student" };
    if (year) query.rollYear = year;
    if (department) query.rollDept = department;
    if (section) query.section = section;

    const students = await User.find(query).select(
      "_id name email rollNumber section rollYear rollDept",
    );
    // return array directly for frontend convenience
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// List attendance records with optional filters
exports.getAttendance = async (req, res) => {
  try {
    const { studentId, dateFrom, dateTo } = req.query;
    const q = {};
    if (studentId) q.student = studentId;
    if (dateFrom || dateTo) q.date = {};
    if (dateFrom) q.date.$gte = new Date(dateFrom);
    if (dateTo) q.date.$lte = new Date(dateTo);

    const records = await AttendanceRecord.find(q).populate(
      "student",
      "name email rollNumber",
    );
    // return array directly
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Mark attendance: expects { studentId, date, status, course, year, department, section }
exports.markAttendance = async (req, res) => {
  try {
    const {
      studentId,
      date,
      status,
      course,
      year,
      department,
      section,
      attendance,
    } = req.body;
    // accept `courseId` alias from frontend
    const courseId = course || req.body.courseId || null;

    let recordDate = new Date(date);
    // If date is invalid and a meetingId is provided, use meeting.startsAt
    if (Number.isNaN(recordDate.getTime()) && req.body.meetingId) {
      try {
        const meeting = await Meeting.findById(req.body.meetingId).select(
          "startsAt",
        );
        if (meeting && meeting.startsAt)
          recordDate = new Date(meeting.startsAt);
      } catch (e) {
        // ignore and fall back to invalid date check later
      }
    }

    // Support two bulk shapes:
    // 1) { attendance: [...] } (generic)
    // 2) { meetingId, updates: [...] } (teacher manual submission)
    const meetingId = req.body.meetingId || null;
    const updates = Array.isArray(attendance)
      ? attendance
      : Array.isArray(req.body.updates)
        ? req.body.updates
        : null;

    // If `attendance` or `updates` array is provided, perform bulk upsert
    if (Array.isArray(updates)) {
      if (meetingId) {
        // prefer meetingId when present
      }

      const ops = [];
      let skipped = 0;

      for (const item of updates) {
        const sid = item.student || item.studentId || item.student_id;
        const st = item.status || item.stat || item.statusType || item;

        // Skip invalid entries (missing student or status)
        if (!sid || !st) {
          skipped++;
          continue;
        }

        // Build filter without injecting null fields (avoid duplicate null index keys)
        const filter = { student: sid, date: recordDate };
        if (courseId) filter.course = courseId;
        if (meetingId) filter.meetingId = meetingId;

        // Build update using $set and $setOnInsert to avoid replacing the whole doc
        const update = {
          $set: {
            status: st,
            markedBy: req.user && req.user._id ? req.user._id : undefined,
            year: year || "",
            department: department || "",
            section: section || "",
          },
          $setOnInsert: {
            student: sid,
            date: recordDate,
          },
        };
        if (courseId) update.$setOnInsert.course = courseId;
        if (meetingId) update.$setOnInsert.meetingId = meetingId;

        ops.push({ updateOne: { filter, update, upsert: true } });
      }

      if (!ops.length) {
        return res.status(400).json({
          success: false,
          message: `No valid attendance items to process (skipped ${skipped}).`,
        });
      }

      try {
        await AttendanceRecord.bulkWrite(ops);
      } catch (e) {
        console.error("bulkWrite failed", {
          error: e,
          attemptedOps: ops.length,
          skipped,
        });
        // Surface more helpful error to client
        return res.status(500).json({
          success: false,
          message:
            "Failed to write attendance bulk. See server logs for details.",
        });
      }

      return res.json({
        success: true,
        message: `Attendance marked (bulk). processed=${ops.length} skipped=${skipped}`,
      });
    }

    // Single record flow
    if (!studentId || !date || !status) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Upsert single record
    const rec = await AttendanceRecord.findOneAndUpdate(
      { student: studentId, date: recordDate, course: courseId || null },
      {
        student: studentId,
        date: recordDate,
        status,
        course: courseId || null,
        markedBy: req.user ? req.user._id : null,
        year: year || "",
        department: department || "",
        section: section || "",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({ success: true, record: rec });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get attendance stats for a student
exports.getAttendanceStats = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId)
      return res
        .status(400)
        .json({ success: false, message: "studentId required" });

    const total = await AttendanceRecord.countDocuments({ student: studentId });
    const present = await AttendanceRecord.countDocuments({
      student: studentId,
      status: "present",
    });
    const absent = total - present;

    res.json({ success: true, stats: { total, present, absent } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Export attendance - simple JSON export
exports.exportAttendance = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const q = {};
    if (dateFrom || dateTo) q.date = {};
    if (dateFrom) q.date.$gte = new Date(dateFrom);
    if (dateTo) q.date.$lte = new Date(dateTo);

    const records = await AttendanceRecord.find(q).populate(
      "student",
      "name email rollNumber",
    );
    // return array directly
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Teacher manual bulk mark + finalize attendance for a meeting
exports.markManualBulk = async (req, res) => {
  try {
    const { meetingId, updates } = req.body;
    if (!meetingId || !Array.isArray(updates)) {
      return res
        .status(400)
        .json({ success: false, message: "meetingId and updates[] required" });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting)
      return res
        .status(404)
        .json({ success: false, message: "Meeting not found" });

    // Only allow owner teacher or admin
    if (
      req.user.role === "teacher" &&
      String(meeting.createdBy) !== String(req.user.id)
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not allowed to mark this meeting" });
    }

    if (meeting.attendanceLocked) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Attendance already finalized for this meeting",
        });
    }

    const recordDate = new Date(meeting.startsAt);
    const ops = [];
    let skipped = 0;

    for (const item of updates) {
      const sid = item.student || item.studentId || item.student_id;
      const st = item.status || item.stat || item.statusType || item;
      if (!sid || !st) {
        skipped++;
        continue;
      }

      const filter = { meetingId, student: sid, date: recordDate };

      const update = {
        $set: {
          status: st,
          markedBy: req.user && req.user._id ? req.user._id : undefined,
          year: meeting.year || "",
          department: meeting.department || "",
          section: meeting.section || "",
        },
        $setOnInsert: {
          student: sid,
          date: recordDate,
          meetingId,
        },
      };

      ops.push({ updateOne: { filter, update, upsert: true } });
    }

    if (!ops.length) {
      return res
        .status(400)
        .json({
          success: false,
          message: `No valid attendance items to process (skipped ${skipped}).`,
        });
    }

    try {
      await AttendanceRecord.bulkWrite(ops);
    } catch (e) {
      console.error("bulkWrite failed (manual)", {
        error: e,
        attemptedOps: ops.length,
        skipped,
      });
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to write attendance bulk. See server logs.",
        });
    }

    // finalize
    meeting.attendanceLocked = true;
    await meeting.save();

    return res.json({
      success: true,
      message: `Attendance finalized. processed=${ops.length} skipped=${skipped}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
