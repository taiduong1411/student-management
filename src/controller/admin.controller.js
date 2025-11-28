const Student = require("../model/student");
const Account = require("../model/account");
const Course = require("../model/course");
const ClassOffering = require("../model/classOffering");
const Enrollment = require("../model/enrollment");
const crypto = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

// Tạo sinh viên mới
const createStudent = async (req, res) => {
  try {
    const {
      studentId,
      firstName,
      lastName,
      middleName,
      dateOfBirth,
      gender,
      email,
      password,
      phone,
      personalEmail,
      className,
      faculty,
      cohortYear,
      enrollmentYear,
      currentSemester,
      contact,
    } = req.body || {};

    if (!studentId || !firstName || !lastName) {
      return res.status(400).json({
        message: "Student ID, first name and last name are required",
      });
    }

    // Kiểm tra studentId đã tồn tại chưa
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(409).json({ message: "Student ID already exists" });
    }

    // Tạo account nếu có email và password
    let accountId = null;
    if (email && password) {
      // Kiểm tra email đã tồn tại chưa
      const existingAccount = await Account.findOne({ email });
      if (existingAccount) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const account = await Account.create({
        email,
        password: hashedPassword,
        role: "student",
        status: "active",
        displayName: `${firstName} ${lastName}`.trim(),
      });
      accountId = account._id;
    }

    // Tạo sinh viên
    const studentData = {
      studentId,
      accountId,
      firstName,
      lastName,
      middleName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      phone,
      personalEmail,
      className,
      faculty,
      cohortYear,
      enrollmentYear,
      currentSemester,
      contact: contact || {
        email,
        phone,
        personalEmail,
      },
      status: "active",
      isActive: true,
    };

    const student = await Student.create(studentData);

    return res.status(201).json({
      message: "Student created successfully",
      student,
    });
  } catch (error) {
    console.error("create student error", error);
    return res.status(500).json({ message: "Unable to create student" });
  }
};

// Lấy danh sách sinh viên (có thể filter theo class, faculty)
const getStudents = async (req, res) => {
  try {
    const { className, faculty, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (className) {
      query.className = className;
    }
    if (faculty) {
      query.faculty = faculty;
    }
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const students = await Student.find(query)
      .populate("accountId", "email displayName role status")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(query);

    return res.status(200).json({
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("get students error", error);
    return res.status(500).json({ message: "Unable to fetch students" });
  }
};

// Lấy thông tin chi tiết một sinh viên
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id).populate(
      "accountId",
      "email displayName role status"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json({ student });
  } catch (error) {
    console.error("get student by id error", error);
    return res.status(500).json({ message: "Unable to fetch student" });
  }
};

// Cập nhật thông tin sinh viên
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Không cho phép cập nhật studentId
    if (updateData.studentId && updateData.studentId !== student.studentId) {
      return res.status(400).json({ message: "Cannot change student ID" });
    }

    // Xử lý dateOfBirth nếu có
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    // Cập nhật thông tin
    Object.assign(student, updateData);
    await student.save();

    const updatedStudent = await Student.findById(id).populate(
      "accountId",
      "email displayName role status"
    );

    return res.status(200).json({
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("update student error", error);
    return res.status(500).json({ message: "Unable to update student" });
  }
};

// Xóa sinh viên
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Xóa account nếu có
    if (student.accountId) {
      await Account.findByIdAndDelete(student.accountId);
    }

    // Xóa sinh viên
    await Student.findByIdAndDelete(id);

    return res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("delete student error", error);
    return res.status(500).json({ message: "Unable to delete student" });
  }
};

// ==================== QUẢN LÝ MÔN HỌC (COURSE) ====================

// Tạo môn học mới
const createCourse = async (req, res) => {
  try {
    const {
      code,
      title,
      description,
      credits,
      contactHours,
      subjectArea,
      faculty,
      prerequisites,
      syllabusUrl,
      status,
    } = req.body || {};

    if (!code || !title) {
      return res
        .status(400)
        .json({ message: "Course code and title are required" });
    }

    // Kiểm tra code đã tồn tại chưa
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(409).json({ message: "Course code already exists" });
    }

    const course = await Course.create({
      code,
      title,
      description,
      credits,
      contactHours,
      subjectArea,
      faculty,
      prerequisites,
      syllabusUrl,
      status: status || "active",
    });

    return res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("create course error", error);
    return res.status(500).json({ message: "Unable to create course" });
  }
};

// Lấy danh sách môn học
const getCourses = async (req, res) => {
  try {
    const { faculty, subjectArea, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (faculty) {
      query.faculty = faculty;
    }
    if (subjectArea) {
      query.subjectArea = subjectArea;
    }
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const courses = await Course.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ code: 1 });

    const total = await Course.countDocuments(query);

    return res.status(200).json({
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("get courses error", error);
    return res.status(500).json({ message: "Unable to fetch courses" });
  }
};

// Lấy thông tin chi tiết một môn học
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.status(200).json({ course });
  } catch (error) {
    console.error("get course by id error", error);
    return res.status(500).json({ message: "Unable to fetch course" });
  }
};

// Cập nhật môn học
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Không cho phép cập nhật code
    if (updateData.code && updateData.code !== course.code) {
      return res.status(400).json({ message: "Cannot change course code" });
    }

    Object.assign(course, updateData);
    await course.save();

    return res.status(200).json({
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error("update course error", error);
    return res.status(500).json({ message: "Unable to update course" });
  }
};

// Xóa môn học
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Kiểm tra có class offerings đang sử dụng course này không
    const classOfferings = await ClassOffering.find({ courseId: id });
    if (classOfferings.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete course. There are class offerings using this course.",
      });
    }

    await Course.findByIdAndDelete(id);

    return res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("delete course error", error);
    return res.status(500).json({ message: "Unable to delete course" });
  }
};

// ==================== QUẢN LÝ LỚP HỌC (CLASS OFFERING) ====================

// Tạo lớp học mới
const createClassOffering = async (req, res) => {
  try {
    const {
      classCode,
      courseId,
      semester,
      instructorName,
      section,
      room,
      campus,
      mode,
      capacity,
      status,
      meetings,
      notes,
    } = req.body || {};

    if (!classCode || !courseId) {
      return res
        .status(400)
        .json({ message: "Class code and course ID are required" });
    }

    // Kiểm tra course có tồn tại không
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Kiểm tra classCode đã tồn tại chưa
    const existingClass = await ClassOffering.findOne({ classCode });
    if (existingClass) {
      return res.status(409).json({ message: "Class code already exists" });
    }

    const classOffering = await ClassOffering.create({
      classCode,
      courseId,
      semester,
      instructorName,
      section,
      room,
      campus,
      mode: mode || "on_campus",
      capacity: capacity || 0,
      enrolledCount: 0,
      status: status || "scheduled",
      meetings: meetings || [],
      notes,
    });

    const classWithCourse = await ClassOffering.findById(
      classOffering._id
    ).populate("courseId");

    return res.status(201).json({
      message: "Class offering created successfully",
      classOffering: classWithCourse,
    });
  } catch (error) {
    console.error("create class offering error", error);
    return res.status(500).json({ message: "Unable to create class offering" });
  }
};

// Lấy danh sách lớp học
const getClassOfferings = async (req, res) => {
  try {
    const { courseId, semester, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (courseId) {
      query.courseId = courseId;
    }
    if (semester) {
      query.semester = semester;
    }
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const classOfferings = await ClassOffering.find(query)
      .populate("courseId")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ semester: -1, classCode: 1 });

    const total = await ClassOffering.countDocuments(query);

    return res.status(200).json({
      classOfferings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("get class offerings error", error);
    return res.status(500).json({ message: "Unable to fetch class offerings" });
  }
};

// Lấy thông tin chi tiết một lớp học
const getClassOfferingById = async (req, res) => {
  try {
    const { id } = req.params;

    const classOffering = await ClassOffering.findById(id).populate("courseId");

    if (!classOffering) {
      return res.status(404).json({ message: "Class offering not found" });
    }

    return res.status(200).json({ classOffering });
  } catch (error) {
    console.error("get class offering by id error", error);
    return res.status(500).json({ message: "Unable to fetch class offering" });
  }
};

// Cập nhật lớp học
const updateClassOffering = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};

    const classOffering = await ClassOffering.findById(id);
    if (!classOffering) {
      return res.status(404).json({ message: "Class offering not found" });
    }

    // Không cho phép cập nhật classCode
    if (
      updateData.classCode &&
      updateData.classCode !== classOffering.classCode
    ) {
      return res.status(400).json({ message: "Cannot change class code" });
    }

    Object.assign(classOffering, updateData);
    await classOffering.save();

    const updatedClass = await ClassOffering.findById(id).populate("courseId");

    return res.status(200).json({
      message: "Class offering updated successfully",
      classOffering: updatedClass,
    });
  } catch (error) {
    console.error("update class offering error", error);
    return res.status(500).json({ message: "Unable to update class offering" });
  }
};

// Xóa lớp học
const deleteClassOffering = async (req, res) => {
  try {
    const { id } = req.params;

    const classOffering = await ClassOffering.findById(id);
    if (!classOffering) {
      return res.status(404).json({ message: "Class offering not found" });
    }

    // Kiểm tra có enrollments đang sử dụng class này không
    const enrollments = await Enrollment.find({ classId: id });
    if (enrollments.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete class offering. There are students enrolled in this class.",
      });
    }

    await ClassOffering.findByIdAndDelete(id);

    return res
      .status(200)
      .json({ message: "Class offering deleted successfully" });
  } catch (error) {
    console.error("delete class offering error", error);
    return res.status(500).json({ message: "Unable to delete class offering" });
  }
};

// ==================== QUẢN LÝ ĐIỂM (GRADES) ====================

// Nhập điểm cho sinh viên
const enterGrade = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { scoreBreakdown, finalScore, letterGrade, gradePoint, notes } =
      req.body || {};

    const enrollment = await Enrollment.findById(enrollmentId).populate({
      path: "classId",
      populate: { path: "courseId" },
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Cập nhật điểm
    if (scoreBreakdown) {
      enrollment.scoreBreakdown = scoreBreakdown.map((item) => ({
        ...item,
        recordedBy: req.user._id,
        recordedAt: new Date(),
      }));
    }

    if (finalScore !== undefined) {
      enrollment.finalScore = finalScore;
    }

    if (letterGrade) {
      enrollment.letterGrade = letterGrade;
    }

    if (gradePoint !== undefined) {
      enrollment.gradePoint = gradePoint;
    }

    if (notes) {
      enrollment.notes = notes;
    }

    enrollment.gradedBy = req.user._id;
    enrollment.gradedAt = new Date();
    enrollment.status = "completed";
    enrollment.completedAt = new Date();

    await enrollment.save();

    // Cập nhật GPA cho sinh viên
    const student = await Student.findById(enrollment.studentId);
    if (student) {
      const allEnrollments = await Enrollment.find({
        studentId: student._id,
        status: { $in: ["completed", "registered"] },
        gradePoint: { $exists: true, $ne: null },
      }).populate({
        path: "classId",
        populate: { path: "courseId" },
      });

      let totalPoints = 0;
      let totalCredits = 0;

      allEnrollments.forEach((enr) => {
        const credits = enr.classId?.courseId?.credits || 0;
        const gp = enr.gradePoint || 0;
        if (credits > 0 && gp > 0) {
          totalPoints += credits * gp;
          totalCredits += credits;
        }
      });

      student.gpa =
        totalCredits > 0
          ? parseFloat((totalPoints / totalCredits).toFixed(2))
          : 0;
      await student.save();
    }

    const updatedEnrollment = await Enrollment.findById(enrollmentId)
      .populate({
        path: "classId",
        populate: { path: "courseId" },
      })
      .populate("studentId", "studentId firstName lastName");

    return res.status(200).json({
      message: "Grade entered successfully",
      enrollment: updatedEnrollment,
    });
  } catch (error) {
    console.error("enter grade error", error);
    return res.status(500).json({ message: "Unable to enter grade" });
  }
};

// Xem điểm theo môn (theo class offering)
const getGradesByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const enrollments = await Enrollment.find({ classId })
      .populate("studentId", "studentId firstName lastName")
      .populate({
        path: "classId",
        populate: { path: "courseId" },
      })
      .sort({ "studentId.studentId": 1 });

    const grades = enrollments.map((enrollment) => ({
      enrollmentId: enrollment._id,
      studentId: enrollment.studentId?.studentId,
      studentName: `${enrollment.studentId?.firstName || ""} ${
        enrollment.studentId?.lastName || ""
      }`.trim(),
      scoreBreakdown: enrollment.scoreBreakdown,
      finalScore: enrollment.finalScore,
      letterGrade: enrollment.letterGrade,
      gradePoint: enrollment.gradePoint,
      status: enrollment.status,
      gradedAt: enrollment.gradedAt,
    }));

    return res.status(200).json({ grades });
  } catch (error) {
    console.error("get grades by class error", error);
    return res.status(500).json({ message: "Unable to fetch grades" });
  }
};

// Xem danh sách enrollments
const getEnrollments = async (req, res) => {
  try {
    const {
      studentId,
      classId,
      semester,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};
    if (studentId) {
      query.studentId = studentId;
    }
    if (classId) {
      query.classId = classId;
    }
    if (semester) {
      query.semester = semester;
    }
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const enrollments = await Enrollment.find(query)
      .populate("studentId", "studentId firstName lastName")
      .populate({
        path: "classId",
        populate: { path: "courseId" },
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ registeredAt: -1 });

    const total = await Enrollment.countDocuments(query);

    return res.status(200).json({
      enrollments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("get enrollments error", error);
    return res.status(500).json({ message: "Unable to fetch enrollments" });
  }
};

// Tính GPA cho một sinh viên
const calculateStudentGPA = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const enrollments = await Enrollment.find({
      studentId: student._id,
      status: { $in: ["completed", "registered"] },
      gradePoint: { $exists: true, $ne: null },
    }).populate({
      path: "classId",
      populate: { path: "courseId" },
    });

    if (enrollments.length === 0) {
      return res.status(200).json({
        gpa: 0,
        totalCredits: 0,
        totalPoints: 0,
        enrollmentsCount: 0,
      });
    }

    let totalPoints = 0;
    let totalCredits = 0;

    enrollments.forEach((enrollment) => {
      const credits = enrollment.classId?.courseId?.credits || 0;
      const gradePoint = enrollment.gradePoint || 0;

      if (credits > 0 && gradePoint > 0) {
        totalPoints += credits * gradePoint;
        totalCredits += credits;
      }
    });

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

    // Cập nhật GPA vào student profile
    student.gpa = parseFloat(gpa.toFixed(2));
    await student.save();

    return res.status(200).json({
      studentId: student.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      gpa: parseFloat(gpa.toFixed(2)),
      totalCredits,
      totalPoints,
      enrollmentsCount: enrollments.length,
    });
  } catch (error) {
    console.error("calculate student GPA error", error);
    return res.status(500).json({ message: "Unable to calculate GPA" });
  }
};

module.exports = {
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
};
