const mongoose = require("mongoose");

const yearSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // e.g., FA22, FA23, FA24
    label: { type: String, required: true }, // e.g., "Fall 2022", "Spring 2023"
  },
  { timestamps: true }
);

module.exports = mongoose.model("Year", yearSchema);
