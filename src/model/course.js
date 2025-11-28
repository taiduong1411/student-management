const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: String,
    credits: { type: Number, default: 3 },
    contactHours: Number,
    subjectArea: String,
    faculty: String,
    prerequisites: [String],
    syllabusUrl: String,
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    effectiveFrom: Date,
    effectiveTo: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);
