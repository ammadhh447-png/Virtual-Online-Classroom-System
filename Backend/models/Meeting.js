const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    year: { type: String, required: true, uppercase: true, trim: true },
    department: { type: String, required: true, uppercase: true, trim: true },
    section: { type: String, required: true, uppercase: true, trim: true },
    roomName: { type: String, required: true, unique: true, trim: true },
    meetUrl: { type: String, required: true, trim: true },
    startsAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 15, max: 300 },
    status: {
      type: String,
      enum: ["scheduled", "live", "ended"],
      default: "scheduled",
    },
    createdBy: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    createdByRole: {
      type: String,
      enum: ["teacher", "admin"],
      required: true,
    },
    attendanceLocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

meetingSchema.index({ year: 1, department: 1, section: 1, startsAt: 1 });
meetingSchema.index({ createdByRole: 1, createdBy: 1, startsAt: -1 });

module.exports = mongoose.model("Meeting", meetingSchema);
