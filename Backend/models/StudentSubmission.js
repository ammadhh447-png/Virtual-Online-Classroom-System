const mongoose = require("mongoose");

const studentSubmissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submissionFileUrl: { type: String, default: null },
    submissionFileName: { type: String, default: null },
    submissionFileType: { type: String, enum: ["pdf", "docx"], default: null },
    status: {
      type: String,
      enum: ["pending", "submitted"],
      default: "pending",
    },
    submittedAt: { type: Date, default: null },
    marks: { type: Number, default: null },
    feedback: { type: String, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StudentSubmission", studentSubmissionSchema);
