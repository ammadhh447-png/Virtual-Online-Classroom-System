const Assignment = require("../models/Assignment");
const StudentSubmission = require("../models/StudentSubmission");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Get assignments for the student's section, year, and department
exports.getAssignmentsForStudent = async (req, res) => {
  try {
    const { section, rollYear, rollDept } = req.user;

    if (!section) {
      return res.status(400).json({
        message: "Student section not found in profile",
      });
    }

    // Build filter object - match section, and also match year/department if they exist
    const filter = { section };

    if (rollYear) {
      filter.year = rollYear;
    }
    if (rollDept) {
      filter.department = rollDept;
    }

    // Fetch assignments for the student's section, year, and department
    const assignments = await Assignment.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// Get submission status for a specific assignment
exports.getSubmissionStatus = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { id: studentId } = req.user;

    const submission = await StudentSubmission.findOne({
      assignmentId,
      studentId,
    });

    res.json(submission || { status: "pending" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// Submit assignment
exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const { id: studentId } = req.user;

    if (!assignmentId) {
      return res.status(400).json({
        message: "Assignment ID is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "File is required for submission",
      });
    }

    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    const fileType = req.file.mimetype.includes("pdf")
      ? "pdf"
      : req.file.mimetype.includes(
            "vnd.openxmlformats-officedocument.wordprocessingml",
          )
        ? "docx"
        : null;

    if (!fileType) {
      return res.status(400).json({
        message: "Only PDF and DOCX files are allowed",
      });
    }

    // Upload to Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "student_submissions",
        resource_type: "raw",
        public_id: `${assignmentId}-${studentId}-${Date.now()}`,
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: "File upload failed." });
        }

        try {
          // Check if submission already exists
          let submission = await StudentSubmission.findOne({
            assignmentId,
            studentId,
          });

          if (submission) {
            // Update existing submission
            submission.submissionFileUrl = result.secure_url;
            submission.submissionFileName = req.file.originalname;
            submission.submissionFileType = fileType;
            submission.status = "submitted";
            submission.submittedAt = new Date();
            await submission.save();
          } else {
            // Create new submission
            submission = new StudentSubmission({
              assignmentId,
              studentId,
              submissionFileUrl: result.secure_url,
              submissionFileName: req.file.originalname,
              submissionFileType: fileType,
              status: "submitted",
              submittedAt: new Date(),
            });
            await submission.save();
          }

          res.json({
            message: "Assignment submitted successfully",
            submission,
          });
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: "Failed to save submission." });
        }
      },
    );

    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// Get all submissions for a specific assignment (teacher view)
exports.getSubmissionsForAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const submissions = await StudentSubmission.find({ assignmentId })
      .populate("studentId", "name email rollNumber section")
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// Get submissions by class (year, department, section) for teacher
exports.getSubmissionsByClass = async (req, res) => {
  try {
    const { year, department, section } = req.query;

    if (!year || !department || !section) {
      return res.status(400).json({
        message: "Year, department, and section are required",
      });
    }

    // Find assignments for this class
    const assignments = await Assignment.find({
      year,
      department,
      section,
    });

    const assignmentIds = assignments.map((a) => a._id);

    // Find all submissions for these assignments
    const submissions = await StudentSubmission.find({
      assignmentId: { $in: assignmentIds },
    })
      .populate("studentId", "name email rollNumber")
      .populate("assignmentId", "title courseName")
      .sort({ submittedAt: -1 });

    // Format response
    const formattedSubmissions = submissions.map((sub) => ({
      _id: sub._id,
      studentName: sub.studentId?.name || "Unknown",
      studentId: sub.studentId?._id,
      assignmentTitle: sub.assignmentId?.title || "Unknown",
      assignmentId: sub.assignmentId?._id,
      submittedAt: sub.submittedAt,
      submissionFileUrl: sub.submissionFileUrl,
      marks: sub.marks,
      feedback: sub.feedback,
      status: sub.status,
    }));

    res.json(formattedSubmissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// Update marks and feedback for a submission
exports.updateMarks = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks, feedback } = req.body;

    const submission = await StudentSubmission.findByIdAndUpdate(
      submissionId,
      { marks, feedback },
      { new: true },
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};
