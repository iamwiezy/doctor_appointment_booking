import express from "express";
import upload from "../middleware/multer.js";
import adminController from "../controllers/adminController.js";
import authAdmin from "../middleware/authAdmin.js";
import { changeAvailability } from "../controllers/doctorController.js";

const {
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
} = adminController;
const adminRouter = express.Router();

adminRouter.post("/add-doctor", authAdmin, upload.single("image"), addDoctor);
adminRouter.post("/login", loginAdmin);
adminRouter.get("/all-doctors", authAdmin, allDoctors);
adminRouter.post("/change-availability", authAdmin, changeAvailability);
adminRouter.get("/appointments", authAdmin, appointmentsAdmin);
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel);
adminRouter.get("/dashboard", authAdmin, adminDashboard);
adminRouter.post("/add-patient", upload.single("image"), authAdmin, addPatient);
adminRouter.get("/all-patients", authAdmin, getAllPatients);
adminRouter.get("/patient/:patientId", authAdmin, getPatientById);
adminRouter.put(
  "/patient/:patientId",
  authAdmin,
  upload.single("image"),
  updatePatient
);
adminRouter.delete("/patient/:patientId", authAdmin, deletePatient);

export default adminRouter;
