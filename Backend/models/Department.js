const mongoose = require("mongoose");

const deptSchema = new mongoose.Schema(
  {
    code: { type: String, required: true }, // e.g., BCS, BSE
    label: { type: String, required: true }, // e.g., "Bachelor of Computer Science"
    yearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Year",
      required: true,
    }, // Link to Year
    sections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section",
      },
    ], // Link to Sections
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", deptSchema);
