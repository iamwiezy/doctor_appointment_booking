import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Basic patient information
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },

  address: {
    type: Object,
    default: {
      line1: "",
      line2: "",
    },
  },
  gender: {
    type: String,
    default: "Not Selected",
  },
  dob: {
    type: String,
    default: "Not Selected",
  },
  phone: {
    type: String,
    default: "9876543210",
  },

  // Medical Information
  medicalHistory: {
    type: String,
    default: "",
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor", // Reference to Doctor model
    default: null,
  },

  // Appointment Details
  appointmentDate: {
    type: String,
    default: "",
  },
  appointmentTime: {
    type: String,
    default: "",
  },

  // Financial Information
  fees: {
    type: Number,
    default: 0,
  },
  xray: {
    type: Boolean,
    default: false,
  },
  treatment: {
    type: String,
    default: "",
  },
  costOfTreatment: {
    type: Number,
    default: 0,
  },
  medicine: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  received: {
    type: Number,
    default: 0,
  },

  // Computed field for balance due (can be calculated on the fly)
  balanceDue: {
    type: Number,
    default: 0,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to calculate total and balance due
userSchema.pre("save", function (next) {
  // Calculate total
  this.total =
    this.fees + (this.xray ? 100 : 0) + this.costOfTreatment + this.medicine;

  // Calculate balance due
  this.balanceDue = this.total - this.received;

  // Update timestamp
  this.updatedAt = Date.now();

  next();
});

// Instance method to calculate balance due
userSchema.methods.calculateBalance = function () {
  return this.total - this.received;
};

// Static method to find patients by doctor
userSchema.statics.findByDoctor = function (doctorId) {
  return this.find({ assignedDoctor: doctorId });
};

// Static method to find patients with pending balance
userSchema.statics.findWithPendingBalance = function () {
  return this.find({ balanceDue: { $gt: 0 } });
};

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
