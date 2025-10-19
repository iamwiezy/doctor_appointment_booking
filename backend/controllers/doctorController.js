import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Change doctor's availability (toggle)
const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body;
    const doctor = await doctorModel.findById(docId);

    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    doctor.available = !doctor.available;
    await doctor.save();

    res.json({ success: true, message: "Doctor availability changed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all doctors (excluding password & email)
const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find().select("-password -email");
    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Doctor login
// Doctor login - Updated for httpOnly cookies
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await doctorModel.findOne({ email });

    if (!doctor) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Credentials" });
    }

    const token = jwt.sign(
      { id: doctor._id, role: "doctor" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // ✅ Clear admin cookie first
    res.clearCookie("adminToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    // Then set doctor cookie
    res.cookie("doctorToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      success: true,
      message: "Doctor login successful",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add logout function
const logoutDoctor = async (req, res) => {
  try {
    res.clearCookie("doctorToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.json({
      success: true,
      message: "Doctor logged out successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get doctor-specific appointments
const appointmentsDoctor = async (req, res) => {
  try {
    const docId = req.body.userId; // taken from decoded token via middleware

    if (!docId) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor ID not found in token" });
    }

    const appointments = await appointmentModel.find({ docId });

    res.json({ success: true, appointments });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const docId = req.body.userId; // taken from decoded token via middleware
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.docId === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        isCompleted: true,
      });
      res.json({ success: true, message: "Appointment marked as completed" });
    } else {
      res.json({ success: false, message: "Appointment completion failed" });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
    console.error("Error in appointmentComplete:", error);
  }
};

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const docId = req.body.userId;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.docId === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        cancelled: true,
      });
      res.json({ success: true, message: "Appointment cancelled" });
    } else {
      res.json({ success: false, message: "Cancellation Failed" });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
    console.error("Error in appointmentComplete:", error);
  }
};

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
  try {
    const docId = req.body.userId;

    const appointments = await appointmentModel.find({ docId });

    let earnings = 0;
    let patients = [];

    appointments.forEach((item) => {
      if (item.isCompleted || item.payment) {
        earnings += item.amount;
      }
      if (!patients.includes(item.userId)) {
        patients.push(item.userId);
      }
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: [...appointments].reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    res.json({ success: false, message: error.message });
    console.error(error);
  }
};

// API to get doctor profile for doctor panel
const doctorProfile = async (req, res) => {
  try {
    const docId = req.body.userId;
    const profileData = await doctorModel.findById(docId).select("-password");

    res.json({ success: true, profileData });
  } catch (error) {
    res.json({ success: false, message: error.message });
    console.error(error);
  }
};

// API to update doctor profile for doctor panel
const updateDoctorProfile = async (req, res) => {
  try {
    const docId = req.body.userId;
    const { fees, address, available } = req.body;

    await doctorModel.findByIdAndUpdate(docId, { fees, address, available });

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
    console.error(error);
  }
};
export default {
  changeAvailability,
  doctorList,
  loginDoctor,
  logoutDoctor,
  appointmentsDoctor,
  appointmentComplete,
  appointmentCancel,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
};
