const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    phone: String,
    age: Number,
    gender: String,
    image: String,
    address: {
      line1: String,
      line2: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
