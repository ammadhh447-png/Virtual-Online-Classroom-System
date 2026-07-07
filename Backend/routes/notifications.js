const express = require("express");
const router = express.Router();
const {
  registerToken,
  getForClass,
  getMyNotifications,
  markAsRead,
  clearNotifications,
  createNotification,
} = require("../controllers/notificationController");
const auth = require("../middlewares/auth");

router.post("/register-token", auth, registerToken);
router.get("/", auth, getForClass);
router.get("/me", auth, getMyNotifications);
router.post("/:id/read", auth, markAsRead);
router.post("/clear", auth, clearNotifications);
// Admin create notification
router.post("/create", auth, createNotification);

module.exports = router;
