const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true }, // e.g., A, B, C, D, E, F
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    }, // Link to Department
  },
  { timestamps: true }
);

// Compound unique index: code + departmentId (so each dept can have A, B, C etc.)
sectionSchema.index({ code: 1, departmentId: 1 }, { unique: true });

module.exports = mongoose.model("Section", sectionSchema);
