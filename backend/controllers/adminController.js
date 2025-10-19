import validator from "validator";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
// API for adding doctor

const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;
    const imageFile = req.file;

    // Check if the details are filled
    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
    ) {
      return res.json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    // validating email paassword
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Enter valid email address",
      });
    }

    // validating password
    if (password.length < 6) {
      return res.json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    if (!imageFile) {
      return res.json({
        success: false,
        message: "Please upload an image",
      });
    }

    // encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // upload image to cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });

    const imageUrl = imageUpload.secure_url;

    const doctorData = {
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: JSON.parse(address),
      date: Date.now(),
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();
    res.json({
      success: true,
      message: "Doctor added successfully",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }

  console.log("Request Body:", req.body);
  console.log("Request File:", req.file);
};

// API for Admin Login

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      // Better JWT payload structure
      const payload = {
        email: email,
        role: "admin",
        isAdmin: true,
        iat: Math.floor(Date.now() / 1000), // Issued at time
      };

      // Sign with payload object and expiration
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "24h", // Token expires in 24 hours
        issuer: "happyodent-admin", // Optional: add issuer
        subject: email, // Optional: subject
      });

      // Set httpOnly cookie
      res.cookie("adminToken", token, {
        httpOnly: true, // Cannot be accessed by JavaScript
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "strict", // CSRF protection
        maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        path: "/",
      });

      // Don't send token in response body anymore
      res.json({
        success: true,
        message: "Admin login successful",
        user: {
          email: email,
          role: "admin",
        },
      });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Admin login error:", error);
    res.json({ success: false, message: error.message });
  }
};

// API for getting all doctors for admin panel
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select("-password");
    res.json({ success: true, doctors });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

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

// API tp get dashboard data for admin panel
const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      latestAppointments: appointments.reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const addPatient = async (req, res) => {
  try {
    console.log("🔍 Add Patient Debug - Request body:", req.body);
    console.log("🔍 Add Patient Debug - Request file:", req.file);

    const {
      name,
      email,
      phone,
      dob,
      gender,
      address,
      medicalHistory,
      assignedDoctor,
      appointmentDate,
      appointmentTime,
      fees,
      xray,
      treatment,
      costOfTreatment,
      medicine,
      total,
      received,
    } = req.body;

    // --- Basic Validation (REMOVED password requirement) ---
    if (!name || !email || !phone || !dob || !gender || !address) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (!validator.isEmail(email)) {
      console.log("❌ Invalid email format");
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check if email already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      console.log("❌ Email already exists");
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Validate assigned doctor if provided
    if (assignedDoctor && assignedDoctor !== "") {
      const doctorExists = await doctorModel.findById(assignedDoctor);
      if (!doctorExists) {
        console.log("❌ Invalid doctor assignment");
        return res.status(400).json({
          success: false,
          message: "Invalid doctor assignment",
        });
      }
    }

    // --- Image Upload ---
    let imageURL = ""; // Default empty string
    if (req.file) {
      try {
        console.log("📸 Uploading image to Cloudinary");
        const imageUpload = await cloudinary.uploader.upload(req.file.path, {
          resource_type: "image",
        });
        imageURL = imageUpload.secure_url;
        console.log("✅ Image uploaded successfully");
      } catch (uploadError) {
        console.error("❌ Image upload failed:", uploadError);
        // Continue without image rather than failing completely
      }
    }

    // --- Generate default password for patient account ---
    const defaultPassword = `${name
      .replace(/\s+/g, "")
      .toLowerCase()}${new Date().getFullYear()}`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // --- Parse address safely ---
    let parsedAddress;
    try {
      parsedAddress =
        typeof address === "string" ? JSON.parse(address) : address;
    } catch (parseError) {
      console.error("❌ Address parsing failed:", parseError);
      return res.status(400).json({
        success: false,
        message: "Invalid address format",
      });
    }

    // --- Prepare patient data ---
    const newUserData = {
      name,
      email,
      password: hashedPassword, // Using generated password
      phone,
      dob,
      gender,
      address: parsedAddress,
      image: imageURL,
      medicalHistory: medicalHistory || "",
      assignedDoctor: assignedDoctor || null,
      appointmentDate: appointmentDate || "",
      appointmentTime: appointmentTime || "",
      fees: Number(fees) || 0,
      xray: xray === "true" || xray === true,
      treatment: treatment || "",
      costOfTreatment: Number(costOfTreatment) || 0,
      medicine: Number(medicine) || 0,
      total: Number(total) || 0,
      received: Number(received) || 0,
    };

    console.log("💾 Saving patient to database");

    // --- Save patient ---
    const newUser = new userModel(newUserData);
    const savedUser = await newUser.save();

    console.log("✅ Patient saved successfully");

    // --- Handle appointment booking if provided ---
    if (assignedDoctor && appointmentDate && appointmentTime) {
      try {
        console.log("📅 Creating appointment");

        // Update doctor's booked slots
        await doctorModel.findByIdAndUpdate(assignedDoctor, {
          $push: { [`slotsBooked.${appointmentDate}`]: appointmentTime },
        });

        // Get doctor details for appointment
        const doctor = await doctorModel
          .findById(assignedDoctor)
          .select("name image fees speciality phone");

        if (doctor) {
          // Create appointment record
          const appointmentData = {
            userId: savedUser._id,
            docId: assignedDoctor,
            userData: {
              name: savedUser.name,
              dob: savedUser.dob,
              phone: savedUser.phone,
              image: savedUser.image,
              totalFees: savedUser.total,
              address: savedUser.address,
              gender: savedUser.gender,
              medicalHistory: savedUser.medicalHistory,
            },
            docData: {
              _id: doctor._id,
              name: doctor.name,
              image: doctor.image,
              fees: doctor.fees,
              speciality: doctor.speciality, // Note: using 'speciality' not 'specialization'
              phone: doctor.phone,
            },
            amount: Number(fees) || 0,
            slotTime: appointmentTime,
            slotDate: appointmentDate,
            date: Date.now(),
          };

          const newAppointment = new appointmentModel(appointmentData);
          await newAppointment.save();

          console.log("✅ Appointment created successfully");
        }
      } catch (appointmentError) {
        console.error("❌ Appointment creation failed:", appointmentError);
        // Don't fail the entire operation, just log the error
        console.log("⚠️ Patient created but appointment booking failed");
      }
    }

    // --- Success Response ---
    res.json({
      success: true,
      message: "Patient added successfully",
      patientId: savedUser._id,
      defaultPassword: defaultPassword, // You might want to remove this in production
    });
  } catch (error) {
    console.error("❌ Error in addPatient:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

// API to get all patients (Admin only)
const getAllPatients = async (req, res) => {
  try {
    const patients = await userModel
      .find({})
      .select("-password") // Exclude password
      .populate({
        path: "assignedDoctor",
        select: "name speciality email image", // Select only needed doctor fields
        model: "doctor", // Make sure this matches your doctor model name
      })
      .sort({ createdAt: -1 }); // Sort by newest first

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
    const {
      name,
      email,
      phone,
      dob,
      gender,
      address,
      // Medical and appointment fields
      assignedDoctor,
      slotDate,
      slotTime,
      medicalHistory,
      // Financial fields
      fees,
      costOfTreatment,
      medicine,
      xray,
      received,
      total,
    } = req.body;

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

    // Basic info
    if (name) updateData.name = name;

    if (email) {
      if (!validator.isEmail(email)) {
        return res.json({
          success: false,
          message: "Enter a valid email",
        });
      }
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

    // Doctor assignment
    if (assignedDoctor) {
      const doctorExists = await doctorModel.findById(assignedDoctor);
      if (!doctorExists) {
        return res.json({
          success: false,
          message: "Selected doctor not found",
        });
      }
      updateData.assignedDoctor = assignedDoctor;
    }

    // Slot fields
    if (slotDate) updateData.slotDate = slotDate;
    if (slotTime) updateData.slotTime = slotTime;

    // Medical history
    if (medicalHistory !== undefined) {
      updateData.medicalHistory = medicalHistory;
    }

    // Financials
    if (fees !== undefined) {
      const feesNum = parseFloat(fees);
      if (isNaN(feesNum) || feesNum < 0) {
        return res.json({
          success: false,
          message: "Invalid consultation fees amount",
        });
      }
      updateData.fees = feesNum;
    }

    if (costOfTreatment !== undefined) {
      const treatmentNum = parseFloat(costOfTreatment);
      if (isNaN(treatmentNum) || treatmentNum < 0) {
        return res.json({
          success: false,
          message: "Invalid treatment cost amount",
        });
      }
      updateData.costOfTreatment = treatmentNum;
    }

    if (medicine !== undefined) {
      const medicineNum = parseFloat(medicine);
      if (isNaN(medicineNum) || medicineNum < 0) {
        return res.json({
          success: false,
          message: "Invalid medicine cost amount",
        });
      }
      updateData.medicine = medicineNum;
    }

    if (xray !== undefined) {
      updateData.xray = xray === "true" || xray === true;
    }

    if (received !== undefined) {
      const receivedNum = parseFloat(received);
      if (isNaN(receivedNum) || receivedNum < 0) {
        return res.json({
          success: false,
          message: "Invalid received amount",
        });
      }
      updateData.received = receivedNum;
    }

    if (
      fees !== undefined ||
      costOfTreatment !== undefined ||
      medicine !== undefined ||
      xray !== undefined
    ) {
      const currentPatient = await userModel.findById(patientId);
      const calculatedTotal =
        (fees !== undefined ? parseFloat(fees) : currentPatient.fees || 0) +
        (costOfTreatment !== undefined
          ? parseFloat(costOfTreatment)
          : currentPatient.costOfTreatment || 0) +
        (medicine !== undefined
          ? parseFloat(medicine)
          : currentPatient.medicine || 0) +
        ((
          xray !== undefined
            ? xray === "true" || xray === true
            : currentPatient.xray
        )
          ? 100
          : 0);

      updateData.total = calculatedTotal;
    } else if (total !== undefined) {
      const totalNum = parseFloat(total);
      if (isNaN(totalNum) || totalNum < 0) {
        return res.json({
          success: false,
          message: "Invalid total amount",
        });
      }
      updateData.total = totalNum;
    }

    // Handle image upload
    if (imageFile) {
      try {
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
          resource_type: "image",
        });
        updateData.image = imageUpload.secure_url;
      } catch (uploadError) {
        return res.json({
          success: false,
          message: "Failed to upload image",
        });
      }
    }

    // Update patient
    const updatedPatient = await userModel.findByIdAndUpdate(
      patientId,
      updateData,
      { new: true }
    );

    if (updatedPatient) {
      await appointmentModel.updateMany(
        { userId: patientId },
        {
          $set: {
            userData: updatedPatient,
            slotDate: updateData.slotDate || patient.slotDate,
            slotTime: updateData.slotTime || patient.slotTime,
          },
        }
      );
    }

    res.json({
      success: true,
      message: "Patient updated successfully",
      patient: updatedPatient,
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

export {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
  addPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
};
