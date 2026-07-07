const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    courseName: { type: String, required: true },
    marks: { type: Number, default: null },
    year: { type: String, default: null },
    department: { type: String, default: null },
    section: {
      type: String,
      enum: ["A", "B", "C", "D", "E", "F"],
      required: true,
    },
    startDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    fileUrl: { type: String, default: null },
    fileName: { type: String, default: null },
    fileType: { type: String, enum: ["pdf", "docx"], default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Assignment", assignmentSchema);
