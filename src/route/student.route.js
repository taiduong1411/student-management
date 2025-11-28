const express = require("express");
const router = express.Router();
const {
  enrollInClass,
  getMyEnrollments,
  dropEnrollment,
  getMyGrades,
  calculateGPA,
  getTimetable,
  getMyProfile,
  updateMyProfile,
  getAvailableClasses,
} = require("../controller/student.controller");
const { authMiddleware } = require("../middleware/auth");

// Tất cả routes yêu cầu authentication
router.use(authMiddleware);

// Profile
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);

// Xem danh sách lớp học có sẵn để đăng ký
router.get("/classes", getAvailableClasses);

// Đăng ký môn học
router.post("/enrollments", enrollInClass);
router.get("/enrollments", getMyEnrollments);
router.delete("/enrollments/:enrollmentId", dropEnrollment);

// Điểm số
router.get("/grades", getMyGrades);
router.get("/gpa", calculateGPA);

// Thời khóa biểu
router.get("/timetable", getTimetable);

module.exports = router;
