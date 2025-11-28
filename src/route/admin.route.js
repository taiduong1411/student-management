const express = require("express");
const router = express.Router();
const {
  // Student management
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  // Course management
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  // Class offering management
  createClassOffering,
  getClassOfferings,
  getClassOfferingById,
  updateClassOffering,
  deleteClassOffering,
  // Grade management
  enterGrade,
  getGradesByClass,
  getEnrollments,
  calculateStudentGPA,
} = require("../controller/admin.controller");
const { authMiddleware, isAdmin } = require("../middleware/auth");

// Tất cả routes đều yêu cầu authentication và admin role
router.use(authMiddleware);
router.use(isAdmin);

// ==================== CRUD SINH VIÊN ====================
router.post("/students", createStudent);
router.get("/students", getStudents);
router.get("/students/:id", getStudentById);
router.put("/students/:id", updateStudent);
router.delete("/students/:id", deleteStudent);

// ==================== CRUD MÔN HỌC ====================
router.post("/courses", createCourse);
router.get("/courses", getCourses);
router.get("/courses/:id", getCourseById);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

// ==================== CRUD LỚP HỌC ====================
router.post("/class-offerings", createClassOffering);
router.get("/class-offerings", getClassOfferings);
router.get("/class-offerings/:id", getClassOfferingById);
router.put("/class-offerings/:id", updateClassOffering);
router.delete("/class-offerings/:id", deleteClassOffering);

// ==================== QUẢN LÝ ĐIỂM ====================
router.post("/enrollments/:enrollmentId/grades", enterGrade);
router.get("/class-offerings/:classId/grades", getGradesByClass);
router.get("/enrollments", getEnrollments);
router.get("/students/:studentId/gpa", calculateStudentGPA);

module.exports = router;
