const Quiz = require("../models/Quiz");
const Teacher = require("../models/Teachers");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

exports.createQuiz = async (req, res) => {
  try {
    const {
      title,
      courseName,
      section,
      startDate,
      dueDate,
      marks,
      year,
      department,
    } = req.body;
    const { id: teacherId } = req.user;

    if (req.user?.role === "teacher") {
      const teacher = await Teacher.findById(teacherId).select("isVerified");
      if (teacher && teacher.isVerified === false) {
        return res.status(403).json({
          message: "Verification is pending. You cannot create quizzes yet.",
        });
      }
    }

    if (!title || !courseName || !section || !startDate || !dueDate || !marks) {
      return res.status(400).json({
        message:
          "Title, course name, section, start date, due date, and marks are required.",
      });
    }

    // Validate section
    if (!["A", "B", "C", "D", "E", "F"].includes(section)) {
      return res.status(400).json({
        message: "Section must be A, B, or C",
      });
    }

    // Validate marks
    if (isNaN(marks) || marks <= 0) {
      return res.status(400).json({
        message: "Marks must be a positive number",
      });
    }

    const quizData = {
      title,
      courseName,
      section,
      startDate,
      dueDate,
      marks,
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
          folder: "quizzes",
          resource_type: "raw",
          public_id: `${Date.now()}-${req.file.originalname}`,
        },
        (error, result) => {
          if (error) {
            return res.status(500).json({ message: "File upload failed." });
          }
          quizData.fileUrl = result.secure_url;
          quizData.fileName = req.file.originalname;
          quizData.fileType = fileType;

          saveQuiz();
        },
      );

      streamifier.createReadStream(req.file.buffer).pipe(stream);

      const saveQuiz = async () => {
        try {
          const quiz = new Quiz(quizData);
          await quiz.save();
          res.status(201).json({
            message: "Quiz created successfully.",
            quiz,
          });
          // Send notification to class (non-blocking)
          try {
            const notificationService = require("../utils/notificationService");
            const targetClass = `${quiz.year}-${quiz.department}-${quiz.section}`;
            notificationService
              .sendNotificationToClass(targetClass, {
                title: `New Quiz: ${quiz.title}`,
                body: `A new quiz has been posted for ${quiz.courseName}. Due: ${quiz.dueDate}`,
                type: "quiz",
                link: `/dashboard/quizzes`,
              })
              .catch((err) => console.error("notify error", err));
          } catch (e) {
            console.error("notification send failed", e);
          }
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: "Failed to create quiz." });
        }
      };
    } else {
      // Save without file
      const quiz = new Quiz(quizData);
      await quiz.save();
      res.status(201).json({
        message: "Quiz created successfully.",
        quiz,
      });
      // notify class
      try {
        const notificationService = require("../utils/notificationService");
        const targetClass = `${quiz.year}-${quiz.department}-${quiz.section}`;
        notificationService
          .sendNotificationToClass(targetClass, {
            title: `New Quiz: ${quiz.title}`,
            body: `A new quiz has been posted for ${quiz.courseName}. Due: ${quiz.dueDate}`,
            type: "quiz",
            link: `/dashboard/quizzes`,
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

exports.getQuizzes = async (req, res) => {
  try {
    const { id: teacherId } = req.user;
    const quizzes = await Quiz.find({ createdBy: teacherId }).sort({
      createdAt: -1,
    });
    res.json(quizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }
    res.json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const { title, courseName, section, startDate, dueDate, marks } = req.body;
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }

    if (title) quiz.title = title;
    if (courseName) quiz.courseName = courseName;
    if (section) {
      if (!["A", "B", "C"].includes(section)) {
        return res.status(400).json({
          message: "Section must be A, B, or C",
        });
      }
      quiz.section = section;
    }
    if (startDate) quiz.startDate = startDate;
    if (dueDate) quiz.dueDate = dueDate;
    if (marks) {
      if (isNaN(marks) || marks <= 0) {
        return res.status(400).json({
          message: "Marks must be a positive number",
        });
      }
      quiz.marks = marks;
    }

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
          folder: "quizzes",
          resource_type: "raw",
          public_id: `${Date.now()}-${req.file.originalname}`,
        },
        (error, result) => {
          if (error) {
            return res.status(500).json({ message: "File upload failed." });
          }
          quiz.fileUrl = result.secure_url;
          quiz.fileName = req.file.originalname;
          quiz.fileType = fileType;

          saveUpdate();
        },
      );

      streamifier.createReadStream(req.file.buffer).pipe(stream);

      const saveUpdate = async () => {
        try {
          await quiz.save();
          res.json({
            message: "Quiz updated successfully.",
            quiz,
          });
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: "Failed to update quiz." });
        }
      };
    } else {
      await quiz.save();
      res.json({
        message: "Quiz updated successfully.",
        quiz,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found." });
    }
    res.json({ message: "Quiz deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};
