const Meeting = require("../models/Meeting");
const Teacher = require("../models/Teachers");

const MEET_BASE_URL = (
  process.env.MEET_BASE_URL || "https://meet.jit.si"
).replace(/\/$/, "");

const toClassCode = (year, department, section) => {
  return `${String(year).toUpperCase()}-${String(department).toUpperCase()}-${String(
    section,
  ).toUpperCase()}`;
};

const parseTeacherClasses = (departmentField = "") => {
  return String(departmentField)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [year, department, section] = entry
        .split("-")
        .map((x) => x?.trim());
      if (!year || !department || !section) return null;
      return toClassCode(year, department, section);
    })
    .filter(Boolean);
};

const buildMeetingRoomName = (year, department, section) => {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `vcui-${String(year).toLowerCase()}-${String(department).toLowerCase()}-${String(
    section,
  ).toLowerCase()}-${stamp}-${rand}`;
};

const isOwnerTeacher = (meeting, userId, role) => {
  return (
    role === "teacher" &&
    meeting.createdByRole === "teacher" &&
    String(meeting.createdBy) === String(userId)
  );
};

exports.createMeeting = async (req, res) => {
  try {
    const { role, id } = req.user;

    if (role === "teacher") {
      const teacher = await Teacher.findById(id).select("isVerified");
      if (teacher && teacher.isVerified === false) {
        return res.status(403).json({
          message: "Verification is pending. You cannot create meetings yet.",
        });
      }
    }

    if (!["teacher", "admin"].includes(role)) {
      return res
        .status(403)
        .json({ message: "Only teacher or admin can create meetings." });
    }

    const {
      title,
      description,
      year,
      department,
      section,
      startsAt,
      durationMinutes,
    } = req.body;

    if (
      !title ||
      !year ||
      !department ||
      !section ||
      !startsAt ||
      !durationMinutes
    ) {
      return res.status(400).json({
        message:
          "Title, year, department, section, start time and duration are required.",
      });
    }

    const parsedDuration = Number(durationMinutes);
    if (
      !Number.isFinite(parsedDuration) ||
      parsedDuration < 15 ||
      parsedDuration > 300
    ) {
      return res
        .status(400)
        .json({ message: "Duration must be between 15 and 300 minutes." });
    }

    const parsedStart = new Date(startsAt);
    if (Number.isNaN(parsedStart.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid meeting start date/time." });
    }

    const normalizedYear = String(year).toUpperCase().trim();
    const normalizedDepartment = String(department).toUpperCase().trim();
    const normalizedSection = String(section).toUpperCase().trim();

    if (role === "teacher") {
      const teacher = await Teacher.findById(id).select("department");
      const teacherClassesRaw =
        teacher?.department || req.user.department || "";

      if (!teacherClassesRaw) {
        return res.status(403).json({
          message:
            "No assigned classes found for this teacher. Please update your class assignments.",
        });
      }

      const allowedClassCodes = parseTeacherClasses(teacherClassesRaw);
      if (!allowedClassCodes.length) {
        return res.status(400).json({
          message:
            "Teacher class format is invalid. Expected format like FA22-BCS-A,FA22-BCS-B.",
        });
      }

      const targetClass = toClassCode(
        normalizedYear,
        normalizedDepartment,
        normalizedSection,
      );

      if (!allowedClassCodes.includes(targetClass)) {
        return res.status(403).json({
          message:
            "You can only create meetings for your assigned class sections.",
        });
      }
    }

    const roomName = buildMeetingRoomName(
      normalizedYear,
      normalizedDepartment,
      normalizedSection,
    );

    const meeting = await Meeting.create({
      title: String(title).trim(),
      description: String(description || "").trim(),
      year: normalizedYear,
      department: normalizedDepartment,
      section: normalizedSection,
      roomName,
      meetUrl: `${MEET_BASE_URL}/${roomName}`,
      startsAt: parsedStart,
      durationMinutes: parsedDuration,
      createdBy: id,
      createdByRole: role,
    });

    // notify class if teacher created the meeting
    try {
      const notificationService = require("../utils/notificationService");
      const targetClass = `${meeting.year}-${meeting.department}-${meeting.section}`;
      notificationService
        .sendNotificationToClass(targetClass, {
          title: `New Meeting: ${meeting.title}`,
          body: `A meeting has been scheduled. Starts: ${meeting.startsAt}`,
          type: "meeting",
          link: `/dashboard/meetings`,
        })
        .catch((err) => console.error("notify error", err));
    } catch (e) {
      console.error("notification send failed", e);
    }

    return res.status(201).json(meeting);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create meeting." });
  }
};

exports.getTeacherMeetings = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teacher can access this route." });
    }

    const meetings = await Meeting.find({
      createdByRole: "teacher",
      createdBy: req.user.id,
    }).sort({ startsAt: -1 });

    return res.json(meetings);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to fetch teacher meetings." });
  }
};

exports.getStudentMeetings = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res
        .status(403)
        .json({ message: "Only students can access this route." });
    }

    const { rollYear, rollDept, section } = req.user;

    if (!rollYear || !rollDept || !section) {
      return res.status(400).json({
        message:
          "Student profile is incomplete. Year, department or section missing.",
      });
    }

    const meetings = await Meeting.find({
      year: String(rollYear).toUpperCase(),
      department: String(rollDept).toUpperCase(),
      section: String(section).toUpperCase(),
      status: { $in: ["scheduled", "live"] },
    }).sort({ startsAt: 1 });

    return res.json(meetings);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to fetch student meetings." });
  }
};

exports.getAdminMeetings = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admin can access this route." });
    }

    const { year, department, section, status } = req.query;
    const query = {};

    if (year) query.year = String(year).toUpperCase();
    if (department) query.department = String(department).toUpperCase();
    if (section) query.section = String(section).toUpperCase();
    if (status && ["scheduled", "live", "ended"].includes(status)) {
      query.status = status;
    }

    const meetings = await Meeting.find(query).sort({ startsAt: -1 });
    return res.json(meetings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch admin meetings." });
  }
};

exports.updateMeetingStatus = async (req, res) => {
  try {
    const { role, id } = req.user;
    const { id: meetingId } = req.params;
    const { status } = req.body;

    if (!["scheduled", "live", "ended"].includes(status)) {
      return res.status(400).json({ message: "Invalid meeting status." });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found." });
    }

    if (!(role === "admin" || isOwnerTeacher(meeting, id, role))) {
      return res
        .status(403)
        .json({ message: "Not allowed to update this meeting." });
    }

    meeting.status = status;
    await meeting.save();

    return res.json(meeting);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to update meeting status." });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const { role, id } = req.user;
    const { id: meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found." });
    }

    if (!(role === "admin" || isOwnerTeacher(meeting, id, role))) {
      return res
        .status(403)
        .json({ message: "Not allowed to delete this meeting." });
    }

    await Meeting.findByIdAndDelete(meetingId);
    return res.json({ message: "Meeting deleted successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete meeting." });
  }
};
