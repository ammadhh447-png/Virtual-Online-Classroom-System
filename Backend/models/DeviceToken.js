const mongoose = require("mongoose");

const DeviceTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DeviceToken", DeviceTokenSchema);
