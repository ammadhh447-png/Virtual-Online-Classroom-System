const express = require("express");
const connectDB = require("./db/db");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS for admin, student, and teacher frontends
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://admin-coral-zeta.vercel.app",
      "https://teacher-ecru.vercel.app",
      "https://student-navy-seven.vercel.app",
      "https://fyp-backend-henna.vercel.app",
      "http://localhost:5173", // Vite default dev port (admin, student, teacher)
      "http://localhost:5174", // Student frontend
      "http://localhost:5175", // Teacher frontend
      "http://localhost:3000", // Alternative dev port
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://127.0.0.1:5175",
      "http://127.0.0.1:3000",
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// connect to database
connectDB();

// mount routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// admin routes
const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);

// upload route (Cloudinary)
const uploadRoutes = require("./routes/upload");
app.use("/api/upload", uploadRoutes);

// assignment routes
const assignmentRoutes = require("./routes/assignment");
app.use("/api/assignments", assignmentRoutes);

// quiz routes
const quizRoutes = require("./routes/quiz");
app.use("/api/quizzes", quizRoutes);

// student assignment routes
const studentAssignmentRoutes = require("./routes/studentAssignments");
app.use("/api/student-assignments", studentAssignmentRoutes);

// student quiz routes
const studentQuizRoutes = require("./routes/studentQuizzes");
app.use("/api/student-quizzes", studentQuizRoutes);

// meeting routes
const meetingRoutes = require("./routes/meeting");
app.use("/api/meetings", meetingRoutes);

// attendance routes
const attendanceRoutes = require("./routes/attendance");
app.use("/api/attendance", attendanceRoutes);

const courseRoutes = require("./routes/courses");
app.use("/api/courses", courseRoutes);

// lecture routes
const lectureRoutes = require("./routes/lectures");
app.use("/api/lectures", lectureRoutes);

// AI routes (chatbot)
const aiRoutes = require("./routes/ai");
app.use("/api/ai", aiRoutes);

// notifications (FCM)
const notificationRoutes = require("./routes/notifications");
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) =>
  res.send("Hello, Online Virtual Class Room Backend!"),
);

// basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

module.exports = app;
