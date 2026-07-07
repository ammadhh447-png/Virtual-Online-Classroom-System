const express = require("express");
const router = express.Router();
const adminAuth = require("../middlewares/adminAuth");
const {
  getYears,
  createYear,
  updateYear,
  deleteYear,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getSections,
  getSectionsByDepartment,
  createSection,
  deleteSection,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/adminController");

// Years
router.get("/years", getYears);
router.post("/years", adminAuth, createYear);
router.put("/years/:id", adminAuth, updateYear);
router.delete("/years/:id", adminAuth, deleteYear);

// Departments
router.get("/departments", getDepartments);
router.post("/departments", adminAuth, createDepartment);
router.put("/departments/:id", adminAuth, updateDepartment);
router.delete("/departments/:id", adminAuth, deleteDepartment);

// Sections
router.get("/sections", getSections);
router.get("/sections/department/:deptId", getSectionsByDepartment);
router.post("/sections", adminAuth, createSection);
router.delete("/sections/:id", adminAuth, deleteSection);

// Users
router.get("/users", adminAuth, getUsers);
router.get("/users/:id", adminAuth, getUserById);
router.put("/users/:id", adminAuth, updateUser);
router.delete("/users/:id", adminAuth, deleteUser);

module.exports = router;
