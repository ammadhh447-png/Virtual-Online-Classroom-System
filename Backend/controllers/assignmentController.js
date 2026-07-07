const Assignment = require("../models/Assignment");
const Teacher = require("../models/Teachers");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

exports.createAssignment = async (req, res) => {
  try {
    const {
      title,
      courseName,
      section,
      startDate,
      dueDate,
      year,
      department,
      marks,
    } = req.body;
    const { id: teacherId } = req.user;

    if (req.user?.role === "teacher") {
      const teacher = await Teacher.findById(teacherId).select("isVerified");
      if (teacher && teacher.isVerified === false) {
        return res.status(403).json({
          message:
            "Verification is pending. You cannot create assignments yet.",
        });
      }
    }

    if (!title || !courseName || !section || !startDate || !dueDate) {
      return res.status(400).json({
        message:
          "Title, course name, section, start date, and due date are required.",
      });
    }

    // Validate section
    if (!["A", "B", "C", "D", "E", "F"].includes(section)) {
      return res.status(400).json({
        message: "Section must be A, B, or C",
      });
    }

    const assignmentData = {
      title,
      courseName,
      marks: marks !== undefined && marks !== "" ? Number(marks) : null,
      section,
      startDate,
      dueDate,
      year,
      department,
      createdBy: teacherId,
    };

    // Handle file upload
    if (req.file) {
      const fileType = req.file.mimetype.includes("pdf")
        ? "pdf"
        : req.file.mimetype.includes(
              "vnd.openxmlformats-officedocument.wordprocessingml",
            )
          ? "docx"
          : null;

      if (!fileType) {
        return res.status(400).json({
          message: "Only PDF and DOCX files are allowed.",
        });
      }

      // Upload to Cloudinary
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "assignments",
          resource_type: "raw",
          public_id: `${Date.now()}-${req.file.originalname}`,
        },
        (error, result) => {
          if (error) {
            return res.status(500).json({ message: "File upload failed." });
          }
          assignmentData.fileUrl = result.secure_url;
          assignmentData.fileName = req.file.originalname;
          assignmentData.fileType = fileType;

          saveAssignment();
        },
      );

      streamifier.createReadStream(req.file.buffer).pipe(stream);

      const saveAssignment = async () => {
        try {
          const assignment = new Assignment(assignmentData);
          await assignment.save();
          res.status(201).json({
            message: "Assignment created successfully.",
            assignment,
          });

          // Send notification to class (non-blocking)
          try {
            const notificationService = require("../utils/notificationService");
            const targetClass = `${assignment.year}-${assignment.department}-${assignment.section}`;
            notificationService
              .sendNotificationToClass(targetClass, {
                title: `New Assignment: ${assignment.title}`,
                body: `A new assignment has been posted for ${assignment.courseName}. Due: ${assignment.dueDate}`,
                type: "assignment",
                link: `/dashboard/assignments`,
              })
              .catch((err) => console.error("notify error", err));
          } catch (e) {
            console.error("notification send failed", e);
          }
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: "Failed to create assignment." });
        }
      };
    } else {
      // Save without file
      const assignment = new Assignment(assignmentData);
      await assignment.save();
      res.status(201).json({
        message: "Assignment created successfully.",
        assignment,
      });

      // notify class
      try {
        const notificationService = require("../utils/notificationService");
        const targetClass = `${assignment.year}-${assignment.department}-${assignment.section}`;
        notificationService
          .sendNotificationToClass(targetClass, {
            title: `New Assignment: ${assignment.title}`,
            body: `A new assignment has been posted for ${assignment.courseName}. Due: ${assignment.dueDate}`,
            type: "assignment",
            link: `/dashboard/assignments`,
          })
          .catch((err) => console.error("notify error", err));
      } catch (e) {
        console.error("notification send failed", e);
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const { id: teacherId } = req.user;
    const assignments = await Assignment.find({ createdBy: teacherId }).sort({
      createdAt: -1,
    });
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }
    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const { title, courseName, section, startDate, dueDate, marks } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    if (title) assignment.title = title;
    if (courseName) assignment.courseName = courseName;
    if (marks !== undefined)
      assignment.marks = marks === "" ? null : Number(marks);
    if (section) {
      if (!["A", "B", "C"].includes(section)) {
        return res.status(400).json({
          message: "Section must be A, B, or C",
        });
      }
      assignment.section = section;
    }
    if (startDate) assignment.startDate = startDate;
    if (dueDate) assignment.dueDate = dueDate;

    // Handle file replacement
    if (req.file) {
      const fileType = req.file.mimetype.includes("pdf")
        ? "pdf"
        : req.file.mimetype.includes(
              "vnd.openxmlformats-officedocument.wordprocessingml",
            )
          ? "docx"
          : null;

      if (!fileType) {
        return res.status(400).json({
          message: "Only PDF and DOCX files are allowed.",
        });
      }

      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "assignments",
          resource_type: "raw",
          public_id: `${Date.now()}-${req.file.originalname}`,
        },
        (error, result) => {
          if (error) {
            return res.status(500).json({ message: "File upload failed." });
          }
          assignment.fileUrl = result.secure_url;
          assignment.fileName = req.file.originalname;
          assignment.fileType = fileType;

          saveUpdate();
        },
      );

      streamifier.createReadStream(req.file.buffer).pipe(stream);

      const saveUpdate = async () => {
        try {
          await assignment.save();
          res.json({
            message: "Assignment updated successfully.",
            assignment,
          });
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: "Failed to update assignment." });
        }
      };
    } else {
      await assignment.save();
      res.json({
        message: "Assignment updated successfully.",
        assignment,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }
    res.json({ message: "Assignment deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};
