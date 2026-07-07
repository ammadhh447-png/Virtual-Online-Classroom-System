const Quiz = require("../models/Quiz");
const StudentQuizSubmission = require("../models/StudentQuizSubmission");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Get quizzes for the student's section, year, and department
exports.getQuizzesForStudent = async (req, res) => {
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

    // Fetch quizzes for the student's section, year, and department
    const quizzes = await Quiz.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

    res.json(quizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// Get submission status for a specific quiz
exports.getQuizSubmissionStatus = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { id: studentId } = req.user;

    const submission = await StudentQuizSubmission.findOne({
      quizId,
      studentId,
    });

    res.json(submission || { status: "pending" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// Submit quiz
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.body;
    const { id: studentId } = req.user;

    if (!quizId) {
      return res.status(400).json({
        message: "Quiz ID is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "File is required for submission",
      });
    }

    // Check if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
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
        folder: "student_quiz_submissions",
        resource_type: "raw",
        public_id: `${quizId}-${studentId}-${Date.now()}`,
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: "File upload failed." });
        }

        try {
          // Check if submission already exists
          let submission = await StudentQuizSubmission.findOne({
            quizId,
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
            submission = new StudentQuizSubmission({
              quizId,
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
            message: "Quiz submitted successfully",
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

// Get all submissions for a specific quiz (teacher view)
exports.getQuizSubmissions = async (req, res) => {
  try {
    const { quizId } = req.params;

    const submissions = await StudentQuizSubmission.find({ quizId })
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

    // Find quizzes for this class
    const quizzes = await Quiz.find({
      year,
      department,
      section,
    });

    const quizIds = quizzes.map((q) => q._id);

    // Find all submissions for these quizzes
    const submissions = await StudentQuizSubmission.find({
      quizId: { $in: quizIds },
    })
      .populate("studentId", "name email rollNumber")
      .populate("quizId", "title courseName")
      .sort({ submittedAt: -1 });

    // Format response
    const formattedSubmissions = submissions.map((sub) => ({
      _id: sub._id,
      studentName: sub.studentId?.name || "Unknown",
      studentId: sub.studentId?._id,
      quizTitle: sub.quizId?.title || "Unknown",
      quizId: sub.quizId?._id,
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

// Update marks and feedback for a quiz submission
exports.updateMarks = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks, feedback } = req.body;

    const submission = await StudentQuizSubmission.findByIdAndUpdate(
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
