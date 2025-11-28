const mongoose = require("mongoose");

const EnrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassOffering",
      required: true,
    },
    status: {
      type: String,
      enum: ["registered", "waitlist", "dropped", "completed", "auditing"],
      default: "registered",
    },
    grade: String,
    gradePoint: Number,
    creditEarned: Number,
    semester: String,
    scoreBreakdown: [
      {
        label: String,
        score: Number,
        maxScore: Number,
        weight: Number,
        recordedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Account",
        },
        recordedAt: { type: Date, default: Date.now },
      },
    ],
    finalScore: Number,
    letterGrade: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    gradedAt: Date,
    registeredAt: { type: Date, default: Date.now },
    completedAt: Date,
    notes: String,
  },
  { timestamps: true }
);

EnrollmentSchema.index({ studentId: 1, classId: 1 }, { unique: true });
EnrollmentSchema.index({ studentId: 1, semester: 1 });

module.exports = mongoose.model("Enrollment", EnrollmentSchema);
