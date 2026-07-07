const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    classes: [{ type: String }], // Array of "year-dept-section" strings
    isImportant: { type: Boolean, default: false },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ["pdf", "docx"], required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Lecture", lectureSchema);
