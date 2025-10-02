import validator from "validator";
import bcrypt from "bcryptjs";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import razorpay from "razorpay";

// API to register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({
        success: false,
        message: "Please provide all the fields",
      });
    }

    // validating email format
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Enter a valid email",
      });
    }
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // validating strong password
    if (!validator.isStrongPassword(password, { minLength: 8 })) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and symbols",
      });
    }

    // hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get user profile data
const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select("-password");
    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update user profile data
const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res.json({
        success: false,
        message: "Please provide all the fields",
      });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });

    if (imageFile) {
      // upload image to cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      const imageURL = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to book appointment
const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;

    // Find the doctor data (exclude password)
    const docData = await doctorModel.findById(docId).select("-password");
    if (!docData) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    if (!docData.available) {
      return res.json({ success: false, message: "Doctor is not available" });
    }

    // Check if slotTime is already booked for that slotDate using slotsBooked object
    const slotsBooked = docData.slotsBooked || {};

    if (slotsBooked[slotDate] && slotsBooked[slotDate].includes(slotTime)) {
      return res.json({ success: false, message: "Slot is not available" });
    }

    // Use $addToSet to atomically add the slotTime to the slotsBooked[slotDate] array
    await doctorModel.findByIdAndUpdate(docId, {
      $addToSet: { [`slotsBooked.${slotDate}`]: slotTime },
    });

    // Get user data (exclude password)
    const userData = await userModel.findById(userId).select("-password");

    // Prepare appointment data
    const appointmentData = {
      userId,
      docId,
      userData,
      docData: { ...docData.toObject(), slotsBooked: undefined }, // Remove slotsBooked from docData copy
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    res.json({ success: true, message: "Appointment booked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to get all appointments of a user
const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;

    // ✅ Add populate to get fresh patient and doctor data
    const appointments = await appointmentModel
      .find({ userId })
      .populate("userData") // This fetches fresh patient data
      .populate("docData") // This fetches fresh doctor data
      .sort({ createdAt: -1 }); // Optional: sort by newest first

    res.json({ success: true, appointments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to cancel an appointment
const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    // Verify appointment data
    if (appointmentData.userId.toString() !== userId) {
      return res.json({ success: false, message: "Unauthorized action" });
    }
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    // Releasing Doctor's slot
    const { docId, slotDate, slotTime } = appointmentData;

    const doctorData = await doctorModel.findById(docId);

    let slotsBooked = doctorData.slotsBooked || {};

    if (!Array.isArray(slotsBooked[slotDate])) {
      return res.status(400).json({
        success: false,
        message: "Slot date not found in doctor's booked slots",
      });
    }

    slotsBooked[slotDate] = slotsBooked[slotDate].filter((e) => e !== slotTime);

    await doctorModel.findByIdAndUpdate(docId, { slotsBooked });

    res.json({ success: true, message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to get all patients (Admin only)
const getAllPatients = async (req, res) => {
  try {
    const patients = await userModel.find({}).select("-password");
    res.json({
      success: true,
      patients,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// API to get a single patient by ID (Admin only)
const getPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await userModel.findById(patientId).select("-password");

    if (!patient) {
      return res.json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      patient,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// API to update patient information (Admin only)
const updatePatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { name, email, phone, dob, gender, address } = req.body;
    const imageFile = req.file;

    // Check if patient exists
    const patient = await userModel.findById(patientId);
    if (!patient) {
      return res.json({
        success: false,
        message: "Patient not found",
      });
    }

    // Prepare update data
    const updateData = {};

    if (name) updateData.name = name;
    if (email) {
      // Validate email format
      if (!validator.isEmail(email)) {
        return res.json({
          success: false,
          message: "Enter a valid email",
        });
      }

      // Check if email is already taken by another user
      const existingUser = await userModel.findOne({
        email,
        _id: { $ne: patientId },
      });
      if (existingUser) {
        return res.json({
          success: false,
          message: "Email is already registered",
        });
      }

      updateData.email = email;
    }
    if (phone) updateData.phone = phone;
    if (dob) updateData.dob = dob;
    if (gender) updateData.gender = gender;
    if (address) updateData.address = JSON.parse(address);

    // Handle image upload
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      updateData.image = imageUpload.secure_url;
    }

    // Update patient
    await userModel.findByIdAndUpdate(patientId, updateData);

    res.json({
      success: true,
      message: "Patient updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check if patient exists
    const patient = await userModel.findById(patientId);
    if (!patient) {
      return res.json({
        success: false,
        message: "Patient not found",
      });
    }

    // Delete the patient
    await userModel.findByIdAndDelete(patientId);

    res.json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// const razorpayInstance = new razorpay({
//   key_id: "",
//   key_secret: "",
// });
// API for razorpay payment integration

// const paymentRazorpay = async (req, res) => {};
export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
};
