const Lecture = require("../models/Lecture");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

exports.createLecture = async (req, res) => {
  try {
    const { title, subject, classes, isImportant } = req.body;
    const { id: teacherId } = req.user;

    if (!title || !subject || !classes) {
      return res.status(400).json({
        message: "Title, subject, and classes are required.",
      });
    }

    const classesArray = Array.isArray(classes)
      ? classes
      : JSON.parse(classes || "[]");

    if (!classesArray.length) {
      return res.status(400).json({
        message: "At least one class must be selected.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "File upload is required.",
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
        message: "Only PDF and DOCX files are allowed.",
      });
    }

    // Upload to Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "lectures",
        resource_type: "raw",
        public_id: `${Date.now()}-${req.file.originalname}`,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary error:", error);
          return res.status(500).json({ message: "File upload failed." });
        }

        const lectureData = {
          title,
          subject,
          classes: classesArray,
          isImportant: isImportant === "true" || isImportant === true,
          fileUrl: result.secure_url,
          fileName: req.file.originalname,
          fileType,
          createdBy: teacherId,
        };

        saveLecture(lectureData);
      },
    );

    streamifier.createReadStream(req.file.buffer).pipe(stream);

    const saveLecture = async (lectureData) => {
      try {
        const lecture = new Lecture(lectureData);
        await lecture.save();
        res.status(201).json({
          message: "Lecture uploaded successfully.",
          lecture,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create lecture." });
      }
    };
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getLecturesByTeacher = async (req, res) => {
  try {
    const { id: teacherId } = req.user;
    const lectures = await Lecture.find({ createdBy: teacherId }).sort({
      createdAt: -1,
    });
    res.json(lectures);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch lectures." });
  }
};

exports.deleteLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { id: teacherId } = req.user;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found." });
    }

    if (lecture.createdBy.toString() !== teacherId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own lectures." });
    }

    await Lecture.findByIdAndDelete(lectureId);
    res.json({ message: "Lecture deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete lecture." });
  }
};

// Student endpoint: get lectures for their assigned classes
exports.getLecturesByClasses = async (req, res) => {
  try {
    const { classes } = req.body; // Expected: array of "year-dept-section"

    if (!Array.isArray(classes) || !classes.length) {
      return res.status(400).json({ message: "Classes array is required." });
    }

    // Find lectures that contain at least one of the student's classes
    const lectures = await Lecture.find({
      classes: { $in: classes },
    }).sort({ createdAt: -1 });

    res.json(lectures);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch lectures." });
  }
};
