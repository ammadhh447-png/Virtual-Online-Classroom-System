const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    year: { type: String, trim: true },
    department: { type: String, trim: true },
    section: { type: String, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Course", courseSchema);
