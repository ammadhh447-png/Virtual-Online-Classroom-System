const User = require("../models/User");
const Teacher = require("../models/Teachers");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Fixed admin credentials
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin123456";

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Configure nodemailer for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
const Notification = require("../models/Notification");

// Generate 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Check if email exists
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    const existingTeacher = await Teacher.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser || existingTeacher) {
      return res.json({ exists: true, message: "Email already registered." });
    }

    return res.json({ exists: false, message: "Email is available." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// Send OTP to email
exports.sendOTP = async (req, res) => {
  try {
    const { email, userType = "Student" } = req.body;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.status(500).json({
        message:
          "Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD.",
      });
    }

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    const existingTeacher = await Teacher.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser || existingTeacher) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Generate and store OTP
    const otp = generateOTP();
    otpStore.set(email.toLowerCase(), {
      otp,
      createdAt: Date.now(),
      attempts: 0,
    });

    // Send OTP via Gmail
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || "chali.94063@gmail.com",
        to: email,
        subject: `Your OTP for Virtual CUI ${userType} Registration`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; text-align: center;">
              <h2 style="color: #333; margin-bottom: 20px;">Email Verification</h2>
              <p style="color: #666; margin-bottom: 20px; font-size: 16px;">
                Your OTP for registering as a ${userType} in Virtual CUI is:
              </p>
              <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="font-size: 32px; font-weight: bold; color: #00A8E8; margin: 0; letter-spacing: 5px;">
                  ${otp}
                </p>
              </div>
              <p style="color: #999; font-size: 14px; margin-top: 20px;">
                This OTP is valid for 5 minutes only. Do not share it with anyone.
              </p>
              <p style="color: #999; font-size: 14px; margin-top: 10px;">
                If you didn't request this OTP, please ignore this email.
              </p>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
              © 2025 Virtual CUI. All rights reserved.
            </p>
          </div>
        `,
      };

      // Retry transient DNS/network errors (EAI_AGAIN) a few times
      const sendWithRetry = async (options, attempts = 3) => {
        let tryCount = 0;
        let delay = 1000;
        while (tryCount < attempts) {
          try {
            return await transporter.sendMail(options);
          } catch (err) {
            tryCount++;
            const isTransient =
              err &&
              (err.code === "EAI_AGAIN" ||
                err.code === "EDNS" ||
                err.errno === -3001);
            if (!isTransient || tryCount >= attempts) throw err;
            console.warn(
              `Transient email error (${err.code}). Retrying ${tryCount}/${attempts} after ${delay}ms...`,
            );
            await new Promise((r) => setTimeout(r, delay));
            delay *= 2;
          }
        }
      };

      await sendWithRetry(mailOptions);
      console.log(`OTP email sent to ${email}`);

      return res.json({
        message: "OTP sent to your email successfully.",
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      return res.status(500).json({
        message:
          "Failed to send OTP email. Please verify email configuration and try again.",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// Verify OTP
exports.getCurrentUser = async (req, res) => {
  try {
    const { id } = req.user;
    if (!id) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    let user = await User.findById(id);
    if (!user) {
      user = await Teacher.findById(id);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const responseUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      role: user.role,
    };

    if (user.rollNumber) {
      responseUser.rollNumber = user.rollNumber;
      responseUser.rollYear = user.rollYear;
      responseUser.rollDept = user.rollDept;
      responseUser.rollSerial = user.rollSerial;
      responseUser.section = user.section;
    }

    if (user.department) {
      responseUser.department = user.department;
    }

    if (typeof user.isVerified !== "undefined") {
      responseUser.isVerified = Boolean(user.isVerified);
    }

    return res.json({ user: responseUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const storedData = otpStore.get(email.toLowerCase());

    if (!storedData) {
      return res
        .status(400)
        .json({ message: "OTP not found. Please request a new OTP." });
    }

    // Check if OTP has expired (5 minutes)
    if (Date.now() - storedData.createdAt > 5 * 60 * 1000) {
      otpStore.delete(email.toLowerCase());
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new OTP." });
    }

    // Check attempts
    if (storedData.attempts >= 3) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts++;
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // OTP verified, remove from store
    otpStore.delete(email.toLowerCase());

    return res.json({
      message: "Email verified successfully.",
      verified: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// Forgot password - generate temporary password and email it to user
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    // basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // Find in User or Teacher
    let user = await User.findOne({ email: email.toLowerCase() });
    let isTeacher = false;
    if (!user) {
      user = await Teacher.findOne({ email: email.toLowerCase() });
      if (user) isTeacher = true;
    }

    if (!user) return res.status(404).json({ message: "Email not found." });

    // Generate temporary password (exactly 6 digits)
    const tempPass = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(tempPass, salt);

    // Update password
    user.password = hashed;
    await user.save();

    // Send email with temporary password
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res
        .status(500)
        .json({ message: "Email service is not configured." });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset - Virtual CUI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5;border-radius:8px;">
          <div style="background:#fff;padding:30px;border-radius:8px;text-align:center;">
            <h2 style="color:#333;margin-bottom:10px">Password Reset</h2>
            <p style="color:#666">A temporary password was generated for your account. Use it to sign in and immediately change your password from your profile.</p>
            <div style="background:#e8f4f8;padding:16px;border-radius:8px;margin:20px 0;">
              <p style="font-size:20px;font-weight:bold;color:#00A8E8;margin:0;">${tempPass}</p>
            </div>
            <p style="color:#999;font-size:12px">If you didn't request this, please contact support.</p>
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailErr) {
      console.error("Failed to send reset email:", emailErr);
      return res
        .status(500)
        .json({ message: "Failed to send email. Check email configuration." });
    }

    return res.json({ message: "Temporary password sent to your email." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { id } = req.user;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!id) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "All password fields are required." });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "New password and confirm password do not match." });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters long." });
    }

    let user = await User.findById(id);
    if (!user) {
      user = await Teacher.findById(id);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ message: "Password changed successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Check against fixed admin credentials
    if (
      email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() ||
      password !== ADMIN_PASSWORD
    ) {
      return res.status(400).json({ message: "Invalid admin credentials." });
    }

    // Create admin token
    const payload = { id: "admin", role: "admin" };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "secretkey", {
      expiresIn: "7d",
    });

    return res.json({
      token,
      user: {
        id: "admin",
        name: "Administrator",
        email: ADMIN_EMAIL,
        role: "admin",
        profileImage: null,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      rollYear,
      rollDept,
      rollSerial,
      section,
      department,
      profileImage,
    } = req.body;

    if (!firstName || !lastName || !password) {
      return res
        .status(400)
        .json({ message: "First name, last name, and password are required." });
    }

    const name = `${firstName} ${lastName}`;
    const userRole = role ? role.toLowerCase() : "student";

    // For students, all roll components and profile image are required
    if (userRole === "student") {
      if (!email || !rollYear || !rollDept || !rollSerial || !section) {
        return res.status(400).json({
          message:
            "Email and roll number components (year, dept, serial) and section are required for students.",
        });
      }
      if (!profileImage) {
        return res.status(400).json({
          message: "Profile picture is required for students.",
        });
      }
      // Validate section (only A, B, C, D, E, F allowed)
      if (!["A", "B", "C", "D", "E", "F"].includes(section.toUpperCase())) {
        return res.status(400).json({
          message: "Section must be Filled",
        });
      }
    } else if (userRole === "teacher") {
      // For teachers, email, department, and profile image are required
      if (!email || !department) {
        return res
          .status(400)
          .json({ message: "Email and department are required for teachers." });
      }
      if (!profileImage) {
        return res.status(400).json({
          message: "Profile picture is required for teachers.",
        });
      }
    }

    const existingEmail = await User.findOne({ email: email?.toLowerCase() });
    if (existingEmail)
      return res.status(400).json({ message: "Email already in use." });

    if (userRole === "student") {
      const constructedRoll = (rollYear + rollDept + rollSerial).toLowerCase();
      const existingRoll = await User.findOne({ rollNumber: constructedRoll });
      if (existingRoll)
        return res
          .status(400)
          .json({ message: "Roll number already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    if (userRole === "teacher") {
      // Create Teacher record
      const teacherData = {
        name,
        email: email.toLowerCase(),
        password: hashed,
        department,
        profileImage: profileImage || null,
        role: "teacher",
      };
      const teacher = new Teacher(teacherData);
      await teacher.save();
      // Schedule auto-verify after 5 minutes (server must stay running)
      setTimeout(
        async () => {
          try {
            const fresh = await Teacher.findById(teacher._id);
            if (fresh && !fresh.isVerified) {
              fresh.isVerified = true;
              await fresh.save();
              // Notify teacher
              const tNote = new Notification({
                title: "Account verified",
                body: "Your teacher account has been automatically verified.",
                type: "verification",
                link: "/dashboard/profile",
                targetClass: null,
                targetUsers: [fresh._id],
              });
              await tNote.save();
              // Notify admins only (not global)
              const aNote = new Notification({
                title: "Teacher auto-verified",
                body: `Teacher ${fresh.name} (${fresh.email}) was auto-verified.`,
                type: "admin",
                link: `/admin/users`,
                targetClass: null,
                targetRole: "admin",
              });
              await aNote.save();
            }
          } catch (e) {
            console.error("Auto-verify task failed", e);
          }
        },
        5 * 60 * 1000,
      );
      return res
        .status(201)
        .json({ message: "Teacher registered successfully." });
    } else {
      // Create Student record (role = student or admin)
      const userData = {
        name,
        email: email.toLowerCase(),
        password: hashed,
        role: userRole,
        rollYear,
        rollDept,
        rollSerial,
        section: section.toUpperCase(),
        profileImage: profileImage || null,
      };
      const user = new User(userData);
      await user.save();
      return res.status(201).json({ message: "User registered successfully." });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

exports.signin = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ message: "Missing credentials." });

    // Try to find in User model first (students/admin)
    let user = await User.findOne({
      email: identifier.toLowerCase(),
    });

    // If not found in User, try Teacher model
    if (!user) {
      user = await Teacher.findOne({
        email: identifier.toLowerCase(),
      });
    }

    // If still not found, try roll number (students only)
    if (!user && !identifier.includes("@")) {
      user = await User.findOne({
        rollNumber: identifier.toLowerCase(),
      });
    }

    if (!user) return res.status(400).json({ message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials." });

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "secretkey", {
      expiresIn: "7d",
    });

    // Build response based on user type
    const response = {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
      },
    };

    // Add roll fields for students
    if (user.rollNumber) {
      response.user.rollNumber = user.rollNumber;
      response.user.rollYear = user.rollYear;
      response.user.rollDept = user.rollDept;
      response.user.rollSerial = user.rollSerial;
      response.user.section = user.section;
    }

    // Add department for teachers
    if (user.department) {
      response.user.department = user.department;
    }

    if (typeof user.isVerified !== "undefined") {
      response.user.isVerified = Boolean(user.isVerified);
    }

    // Add verification flag for teachers
    if (typeof user.isVerified !== "undefined") {
      response.user.isVerified = Boolean(user.isVerified);
    }

    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const { name, email, profileImage } = req.body;

    if (!id) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    // Try User model first (students)
    let user = await User.findById(id);
    let isTeacher = false;

    // If not found, try Teacher model
    if (!user) {
      user = await Teacher.findById(id);
      isTeacher = true;
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (name) user.name = name;
    if (email) {
      const Model = isTeacher ? Teacher : User;
      const existingEmail = await Model.findOne({
        email: email.toLowerCase(),
        _id: { $ne: id },
      });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use." });
      }
      user.email = email.toLowerCase();
    }
    if (profileImage) user.profileImage = profileImage;

    await user.save();

    const response = {
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
      },
    };

    // Add roll fields for students
    if (user.rollNumber) {
      response.user.rollNumber = user.rollNumber;
      response.user.rollYear = user.rollYear;
      response.user.rollDept = user.rollDept;
      response.user.rollSerial = user.rollSerial;
      response.user.section = user.section;
    }

    // Add department for teachers
    if (user.department) {
      response.user.department = user.department;
    }

    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};
