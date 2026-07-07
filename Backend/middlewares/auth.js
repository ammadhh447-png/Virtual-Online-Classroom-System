const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Teacher = require("../models/Teachers");

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    req.user = decoded;

    // Fetch complete user data
    if (decoded.id !== "admin") {
      let user = await User.findById(decoded.id);
      if (!user) {
        user = await Teacher.findById(decoded.id);
      }
      if (user) {
        req.user.section = user.section;
        req.user.email = user.email;
        req.user.name = user.name;
        req.user.rollYear = user.rollYear || null;
        req.user.rollDept = user.rollDept || null;
        req.user.department = user.department || null;
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

module.exports = auth;
