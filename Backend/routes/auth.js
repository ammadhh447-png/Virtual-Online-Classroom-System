const express = require("express");
const router = express.Router();
const {
  adminLogin,
  signup,
  signin,
  updateProfile,
  changePassword,
  getCurrentUser,
  checkEmail,
  sendOTP,
  verifyOTP,
} = require("../controllers/authController");
const auth = require("../middlewares/auth");

router.post("/admin-login", adminLogin);
router.post("/signup", signup);
router.post("/signin", signin);
router.get("/me", auth, getCurrentUser);
router.put("/profile", auth, updateProfile);
router.put("/change-password", auth, changePassword);
router.post("/check-email", checkEmail);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post(
  "/forgot-password",
  require("../controllers/authController").forgotPassword,
);

module.exports = router;
