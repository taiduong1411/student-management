const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    },
    startTime: String,
    endTime: String,
    room: String,
    building: String,
  },
  { _id: false }
);

const ClassOfferingSchema = new mongoose.Schema(
  {
    classCode: { type: String, required: true, unique: true },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    semester: String,
    instructorName: String,
    section: String,
    room: String,
    campus: String,
    mode: {
      type: String,
      enum: ["on_campus", "online", "hybrid"],
      default: "on_campus",
    },
    capacity: { type: Number, default: 0 },
    enrolledCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["scheduled", "open", "closed", "cancelled"],
      default: "scheduled",
    },
    meetings: [MeetingSchema],
    notes: String,
  },
  { timestamps: true }
);

ClassOfferingSchema.index({ courseId: 1 });

module.exports = mongoose.model("ClassOffering", ClassOfferingSchema);
