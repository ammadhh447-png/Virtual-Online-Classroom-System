const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    rollYear: { type: String, required: true },
    rollDept: { type: String, required: true },
    rollSerial: { type: String, required: true },
    section: { type: String, default: null },
    rollNumber: { type: String, default: null, unique: true, sparse: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: null },
    role: { type: String, default: "student" },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  // For students: construct rollNumber from rollYear, rollDept, rollSerial
  if (
    this.role === "student" &&
    this.rollYear &&
    this.rollDept &&
    this.rollSerial
  ) {
    this.rollNumber = (
      this.rollYear +
      this.rollDept +
      this.rollSerial
    ).toLowerCase();
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
