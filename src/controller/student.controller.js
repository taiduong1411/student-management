const Student = require("../model/student");
const Enrollment = require("../model/enrollment");
const ClassOffering = require("../model/classOffering");
const Course = require("../model/course");

// Đăng ký môn học
const enrollInClass = async (req, res) => {
  try {
    const { classId, semester } = req.body || {};
    const account = req.user;

    if (!classId) {
      return res.status(400).json({ message: "Class ID is required" });
    }

    // Tìm student từ account
    const student = await Student.findOne({ accountId: account._id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    // Kiểm tra class có tồn tại không
    const classOffering = await ClassOffering.findById(classId).populate(
      "courseId"
    );
    if (!classOffering) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Kiểm tra class có còn chỗ không
    if (
      classOffering.capacity > 0 &&
      classOffering.enrolledCount >= classOffering.capacity
    ) {
      return res.status(400).json({ message: "Class is full" });
    }

    // Kiểm tra đã đăng ký chưa
    const existingEnrollment = await Enrollment.findOne({
      studentId: student._id,
      classId: classId,
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === "dropped") {
        // Nếu đã drop trước đó, cho phép đăng ký lại
        existingEnrollment.status = "registered";
        existingEnrollment.semester = semester || classOffering.semester;
        await existingEnrollment.save();

        // Tăng số lượng đăng ký
        classOffering.enrolledCount += 1;
        await classOffering.save();

        return res.status(200).json({
          message: "Re-enrolled successfully",
          enrollment: existingEnrollment,
        });
      }
      return res
        .status(409)
        .json({ message: "Already enrolled in this class" });
    }

    // Tạo enrollment mới
    const enrollment = await Enrollment.create({
      studentId: student._id,
      classId: classId,
      semester: semester || classOffering.semester,
      status: "registered",
    });

    // Tăng số lượng đăng ký
    classOffering.enrolledCount += 1;
    await classOffering.save();

    const enrollmentWithDetails = await Enrollment.findById(
      enrollment._id
    ).populate({
      path: "classId",
      populate: { path: "courseId" },
    });

    return res.status(201).json({
      message: "Enrolled successfully",
      enrollment: enrollmentWithDetails,
    });
  } catch (error) {
    console.error("enroll in class error", error);
    return res.status(500).json({ message: "Unable to enroll in class" });
  }
};

// Xem danh sách môn đã đăng ký
const getMyEnrollments = async (req, res) => {
  try {
    const { semester, status } = req.query;
    const account = req.user;

    // Tìm student từ account
    const student = await Student.findOne({ accountId: account._id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const query = { studentId: student._id };
    if (semester) {
      query.semester = semester;
    }
    if (status) {
      query.status = status;
    }

    const enrollments = await Enrollment.find(query)
      .populate({
        path: "classId",
        populate: { path: "courseId" },
      })
      .sort({ registeredAt: -1 });

    return res.status(200).json({ enrollments });
  } catch (error) {
    console.error("get my enrollments error", error);
    return res.status(500).json({ message: "Unable to fetch enrollments" });
  }
};

// Xóa đăng ký môn (drop enrollment)
const dropEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const account = req.user;

    // Tìm student từ account
    const student = await Student.findOne({ accountId: account._id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    // Tìm enrollment
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Kiểm tra enrollment thuộc về student này
    if (enrollment.studentId.toString() !== student._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Kiểm tra đã drop chưa
    if (enrollment.status === "dropped") {
      return res.status(400).json({ message: "Already dropped" });
    }

    // Cập nhật status
    enrollment.status = "dropped";
    await enrollment.save();

    // Giảm số lượng đăng ký
    const classOffering = await ClassOffering.findById(enrollment.classId);
    if (classOffering && classOffering.enrolledCount > 0) {
      classOffering.enrolledCount -= 1;
      await classOffering.save();
    }

    return res.status(200).json({ message: "Dropped successfully" });
  } catch (error) {
    console.error("drop enrollment error", error);
    return res.status(500).json({ message: "Unable to drop enrollment" });
  }
};

// Xem điểm theo môn
const getMyGrades = async (req, res) => {
  try {
    const { semester } = req.query;
    const account = req.user;

    // Tìm student từ account
    const student = await Student.findOne({ accountId: account._id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const query = { studentId: student._id };
    if (semester) {
      query.semester = semester;
    }

    const enrollments = await Enrollment.find(query)
      .populate({
        path: "classId",
        populate: { path: "courseId" },
      })
      .sort({ semester: -1, registeredAt: -1 });

    const grades = enrollments.map((enrollment) => ({
      enrollmentId: enrollment._id,
      classCode: enrollment.classId?.classCode,
      courseCode: enrollment.classId?.courseId?.code,
      courseTitle: enrollment.classId?.courseId?.title,
      credits: enrollment.classId?.courseId?.credits,
      semester: enrollment.semester,
      scoreBreakdown: enrollment.scoreBreakdown,
      finalScore: enrollment.finalScore,
      letterGrade: enrollment.letterGrade,
      gradePoint: enrollment.gradePoint,
      status: enrollment.status,
    }));

    return res.status(200).json({ grades });
  } catch (error) {
    console.error("get my grades error", error);
    return res.status(500).json({ message: "Unable to fetch grades" });
  }
};

// Tính điểm trung bình (GPA)
const calculateGPA = async (req, res) => {
  try {
    const account = req.user;

    // Tìm student từ account
    const student = await Student.findOne({ accountId: account._id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    // Lấy tất cả enrollments đã hoàn thành (có điểm)
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
      gpa: parseFloat(gpa.toFixed(2)),
      totalCredits,
      totalPoints,
      enrollmentsCount: enrollments.length,
    });
  } catch (error) {
    console.error("calculate GPA error", error);
    return res.status(500).json({ message: "Unable to calculate GPA" });
  }
};

// Xem thời khóa biểu (danh sách môn đã đăng ký theo học kỳ)
const getTimetable = async (req, res) => {
  try {
    const { semester } = req.query;
    const account = req.user;

    // Tìm student từ account
    const student = await Student.findOne({ accountId: account._id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const query = {
      studentId: student._id,
      status: { $in: ["registered", "completed"] },
    };

    if (semester) {
      query.semester = semester;
    } else if (student.currentSemester) {
      query.semester = student.currentSemester;
    }

    const enrollments = await Enrollment.find(query)
      .populate({
        path: "classId",
        populate: { path: "courseId" },
      })
      .sort({
        "classId.meetings.dayOfWeek": 1,
        "classId.meetings.startTime": 1,
      });

    const timetable = enrollments.map((enrollment) => ({
      enrollmentId: enrollment._id,
      classCode: enrollment.classId?.classCode,
      courseCode: enrollment.classId?.courseId?.code,
      courseTitle: enrollment.classId?.courseId?.title,
      credits: enrollment.classId?.courseId?.credits,
      instructorName: enrollment.classId?.instructorName,
      section: enrollment.classId?.section,
      room: enrollment.classId?.room,
      campus: enrollment.classId?.campus,
      mode: enrollment.classId?.mode,
      meetings: enrollment.classId?.meetings || [],
      semester: enrollment.semester,
    }));

    return res.status(200).json({
      semester: semester || student.currentSemester,
      timetable,
    });
  } catch (error) {
    console.error("get timetable error", error);
    return res.status(500).json({ message: "Unable to fetch timetable" });
  }
};

// Xem thông tin profile của chính mình
const getMyProfile = async (req, res) => {
  try {
    const account = req.user;

    const student = await Student.findOne({ accountId: account._id }).populate(
      "accountId",
      "email displayName role status"
    );

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    return res.status(200).json({ student });
  } catch (error) {
    console.error("get my profile error", error);
    return res.status(500).json({ message: "Unable to fetch profile" });
  }
};

// Cập nhật thông tin profile của chính mình
const updateMyProfile = async (req, res) => {
  try {
    const account = req.user;
    const updateData = req.body || {};

    const student = await Student.findOne({ accountId: account._id });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    // Không cho phép cập nhật một số trường nhạy cảm
    delete updateData.studentId;
    delete updateData.accountId;
    delete updateData.status;
    delete updateData.isActive;

    // Xử lý dateOfBirth nếu có
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    // Cập nhật thông tin
    Object.assign(student, updateData);
    await student.save();

    // Cập nhật displayName trong account nếu có thay đổi tên
    if (updateData.firstName || updateData.lastName) {
      const accountUpdate = await Account.findById(account._id);
      if (accountUpdate) {
        accountUpdate.displayName =
          `${student.firstName} ${student.lastName}`.trim();
        await accountUpdate.save();
      }
    }

    const updatedStudent = await Student.findOne({
      accountId: account._id,
    }).populate("accountId", "email displayName role status");

    return res.status(200).json({
      message: "Profile updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("update my profile error", error);
    return res.status(500).json({ message: "Unable to update profile" });
  }
};

// Xem danh sách lớp học có sẵn để đăng ký
const getAvailableClasses = async (req, res) => {
  try {
    const { courseId, semester, status } = req.query;

    const query = {};
    if (courseId) {
      query.courseId = courseId;
    }
    if (semester) {
      query.semester = semester;
    }
    // Chỉ hiển thị các lớp đang mở đăng ký
    query.status = status || "open";

    const classOfferings = await ClassOffering.find(query)
      .populate("courseId")
      .sort({ semester: -1, classCode: 1 });

    // Lọc các lớp còn chỗ
    const availableClasses = classOfferings.filter((classOffering) => {
      return (
        classOffering.capacity === 0 ||
        classOffering.enrolledCount < classOffering.capacity
      );
    });

    return res.status(200).json({ classOfferings: availableClasses });
  } catch (error) {
    console.error("get available classes error", error);
    return res.status(500).json({ message: "Unable to fetch classes" });
  }
};

module.exports = {
  enrollInClass,
  getMyEnrollments,
  dropEnrollment,
  getMyGrades,
  calculateGPA,
  getTimetable,
  getMyProfile,
  updateMyProfile,
  getAvailableClasses,
};
