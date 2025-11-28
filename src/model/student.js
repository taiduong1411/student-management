const mongoose = require("mongoose");

const ContactInfoSchema = new mongoose.Schema(
  {
    email: { type: String, lowercase: true, trim: true },
    personalEmail: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    alternatePhone: { type: String, trim: true },
    address: {
      street: String,
      ward: String,
      district: String,
      city: String,
    },
    emergencyContacts: [
      {
        name: String,
        relationship: String,
        phone: String,
      },
    ],
  },
  { _id: false }
);

const DocumentSchema = new mongoose.Schema(
  {
    type: String,
    url: String,
    issuedAt: Date,
    verified: { type: Boolean, default: false },
  },
  { _id: false }
);

const StudentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["male", "female", "other", "undisclosed"],
      default: "undisclosed",
    },
    avatarUrl: String,
    cohortYear: Number,
    enrollmentYear: Number,
    status: {
      type: String,
      enum: ["active", "on_leave", "suspended", "graduated", "alumni"],
      default: "active",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    contact: ContactInfoSchema,
    currentSemester: String,
    personalEmail: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    gpa: { type: Number, min: 0, max: 4 },
    documents: [DocumentSchema],
    admits: {
      admissionType: String,
      admissionDate: Date,
      admitStatus: String,
    },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", StudentSchema);
