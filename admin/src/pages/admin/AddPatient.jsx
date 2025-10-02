// components/AddPatient/AddPatient.jsx

import React, { useContext, useState, useEffect } from "react";
import { assets } from "../../assets/assets";
import { AdminContext } from "../../context/AdminContext";
import { toast } from "react-toastify";
import axios from "axios";

const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const AddPatient = () => {
  // Basic patient info
  const [image, setImage] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Not Selected");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");

  // Additional patient details
  const [medicalHistory, setMedicalHistory] = useState("");
  const [assignedDoctor, setAssignedDoctor] = useState("");

  // Appointment booking states
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  // Finance fields
  const [fees, setFees] = useState(0);
  const [xray, setXray] = useState(false);
  const [treatment, setTreatment] = useState("");
  const [costOfTreatment, setCostOfTreatment] = useState(0);
  const [medicine, setMedicine] = useState(0);
  const [total, setTotal] = useState(0);
  const [received, setReceived] = useState(0);

  // Context - Updated to work with httpOnly cookies
  const { doctors, getAllDoctors, backendUrl, aToken } =
    useContext(AdminContext);

  useEffect(() => {
    if (aToken) {
      getAllDoctors();
    }
  }, [aToken]);

  // Auto-calculate total
  useEffect(() => {
    const calculatedTotal =
      Number(fees) +
      (xray ? 100 : 0) +
      Number(costOfTreatment) +
      Number(medicine);
    setTotal(calculatedTotal);
  }, [fees, xray, costOfTreatment, medicine]);

  // Get available slots when doctor is selected
  useEffect(() => {
    if (assignedDoctor) {
      const doctor = doctors.find((doc) => doc._id === assignedDoctor);
      if (doctor) {
        setSelectedDoctor(doctor);
        getAvailableSlots(doctor);
      }
    } else {
      setSelectedDoctor(null);
      setDocSlots([]);
      setSlotTime("");
      setAppointmentDate("");
      setAppointmentTime("");
    }
  }, [assignedDoctor, doctors]);

  const getAvailableSlots = async (doc) => {
    setDocSlots([]);
    const today = new Date();
    const updatedSlots = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      const endTime = new Date(currentDate);
      endTime.setHours(21, 0, 0, 0);

      if (i === 0) {
        currentDate.setHours(
          currentDate.getHours() + 1 < 10 ? 10 : currentDate.getHours() + 1
        );
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
      } else {
        currentDate.setHours(10);
        currentDate.setMinutes(0);
      }

      const timeSlots = [];

      while (currentDate < endTime) {
        const formattedTime = currentDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        const slotDate = currentDate
          .toLocaleDateString("en-GB")
          .split("/")
          .join("-");

        // Fixed field name to match schema
        const isBooked = !!doc.slotsBooked?.[slotDate]?.includes(formattedTime);

        timeSlots.push({
          dateTime: new Date(currentDate),
          time: formattedTime,
          isBooked,
        });

        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }

      updatedSlots.push(timeSlots);
    }

    setDocSlots(updatedSlots);
  };

  const handleSlotSelection = (time, selectedSlotIndex) => {
    setSlotTime(time);

    // Set appointment date and time for form submission
    const selectedDaySlots = docSlots[selectedSlotIndex];
    const selectedDateTime = selectedDaySlots?.[0]?.dateTime;

    if (selectedDateTime) {
      const slotDate = selectedDateTime
        .toLocaleDateString("en-GB")
        .split("/")
        .join("-");
      setAppointmentDate(slotDate);
      setAppointmentTime(time);
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      if (assignedDoctor && !slotTime) {
        return toast.error("Please select an appointment time slot");
      }

      const formData = new FormData();

      // Basic patient info
      formData.append("image", image);
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("dob", dob);
      formData.append("gender", gender);
      formData.append(
        "address",
        JSON.stringify({ line1: address1, line2: address2 })
      );

      // Additional patient details
      formData.append("medicalHistory", medicalHistory);
      formData.append("assignedDoctor", assignedDoctor);
      formData.append("appointmentDate", appointmentDate);
      formData.append("appointmentTime", appointmentTime);

      // Finance details
      formData.append("fees", fees);
      formData.append("xray", xray);
      formData.append("treatment", treatment);
      formData.append("costOfTreatment", costOfTreatment);
      formData.append("medicine", medicine);
      formData.append("total", total);
      formData.append("received", received);

      // Updated axios call for httpOnly cookies - REMOVED headers with aToken
      const { data } = await axios.post(
        backendUrl + "/api/admin/add-patient",
        formData,
        {
          withCredentials: true, // This sends httpOnly cookies automatically
          // Don't set Content-Type for FormData - let axios handle it automatically
        }
      );

      if (data.success) {
        toast.success(data.message);
        // Reset all form fields
        setImage(false);
        setName("");
        setEmail("");
        setPhone("");
        setDob("");
        setGender("Not Selected");
        setAddress1("");
        setAddress2("");
        setMedicalHistory("");
        setAssignedDoctor("");
        setAppointmentDate("");
        setAppointmentTime("");
        setFees(0);
        setXray(false);
        setTreatment("");
        setCostOfTreatment(0);
        setMedicine(0);
        setTotal(0);
        setReceived(0);
        setSlotTime("");
        setDocSlots([]);
        setSelectedDoctor(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      // Enhanced error handling for authentication issues
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please login again.");
        // You might want to redirect to login or trigger a logout here
      } else {
        toast.error(error.response?.data?.message || "An error occurred");
      }
      console.error("Add patient error:", error);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="m-5 w-full">
      <p className="mb-3 text-lg font-medium">Add Patient</p>
      <div className="bg-white px-8 py-8 border rounded w-full max-w-6xl max-h-[80vh] overflow-y-scroll flex flex-col gap-4">
        {/* Patient Image Upload */}
        {/* <div className="flex items-center gap-4 mb-8 text-gray-500">
          <label htmlFor="patient-img">
            <img
              className="w-16 bg-gray-100 rounded-full cursor-pointer"
              src={image ? URL.createObjectURL(image) : assets.upload_area}
              alt=""
            />
          </label>
          <input
            onChange={(e) => setImage(e.target.files[0])}
            type="file"
            id="patient-img"
            hidden
            required
          />
          <p>
            Upload patient <br />
            picture
          </p>
        </div> */}

        {/* Form Fields */}
        <div className="flex flex-col lg:flex-row items-start gap-10 text-gray-600">
          {/* Left Column - Basic Info */}
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Basic Information
            </h3>

            <div className="flex flex-col gap-1">
              <p>Patient name</p>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="Name"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <p>Patient Email</p>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="border rounded px-3 py-2"
                type="email"
                placeholder="Email"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <p>Phone</p>
              <input
                onChange={(e) => setPhone(e.target.value)}
                value={phone}
                className="border rounded px-3 py-2"
                type="tel"
                placeholder="Phone Number"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <p>Date of Birth</p>
              <input
                onChange={(e) => setDob(e.target.value)}
                value={dob}
                className="border rounded px-3 py-2"
                type="date"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <p>Gender</p>
              <select
                onChange={(e) => setGender(e.target.value)}
                value={gender}
                className="border rounded px-3 py-2">
                <option value="Not Selected">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <p>Address</p>
              <input
                onChange={(e) => setAddress1(e.target.value)}
                value={address1}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="Address Line 1"
                required
              />
              <input
                onChange={(e) => setAddress2(e.target.value)}
                value={address2}
                className="border rounded px-3 py-2"
                type="text"
                placeholder="Address Line 2"
              />
            </div>
          </div>

          {/* Right Column - Medical & Appointment Info */}
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Medical Information
            </h3>

            <div className="flex flex-col gap-1">
              <p>Medical History</p>
              <textarea
                rows={4}
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                className="border rounded px-3 py-2"
                placeholder="Enter medical history..."
              />
            </div>

            <div className="flex flex-col gap-1">
              <p>Assigned Doctor</p>
              <select
                value={assignedDoctor}
                onChange={(e) => setAssignedDoctor(e.target.value)}
                className="border rounded px-3 py-2">
                <option value="">Select Doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    Dr. {doctor.name} - {doctor.speciality}
                  </option>
                ))}
              </select>
            </div>

            {/* Appointment Booking Section */}
            {selectedDoctor && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="text-md font-semibold text-gray-700 mb-3">
                  Book Appointment with Dr. {selectedDoctor.name}
                </h4>

                {/* Date Selection */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Select Date:
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {docSlots.map((slots, index) => {
                      const date = slots[0]?.dateTime;
                      return (
                        <div
                          key={date ? date.toISOString() : index}
                          onClick={() => setSlotIndex(index)}
                          className={`text-center py-2 px-3 min-w-16 rounded-lg cursor-pointer text-sm ${
                            slotIndex === index
                              ? "bg-primary text-white"
                              : "border border-gray-300 bg-white"
                          }`}>
                          <p className="font-medium">
                            {date ? daysOfWeek[date.getDay()] : "N/A"}
                          </p>
                          <p className="text-xs">
                            {date ? date.getDate() : "--"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slot Selection */}
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Select Time:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {docSlots[slotIndex]?.map((slot, index) => {
                      const isSelected = slot.time === slotTime;
                      const isBooked = slot.isBooked;

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() =>
                            !isBooked &&
                            handleSlotSelection(slot.time, slotIndex)
                          }
                          disabled={isBooked}
                          className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                            isBooked
                              ? "text-red-400 border border-red-300 cursor-not-allowed bg-red-50"
                              : isSelected
                              ? "bg-primary text-white"
                              : "text-gray-600 border border-gray-300 hover:border-primary"
                          }`}>
                          {slot.time.toLowerCase()}
                        </button>
                      );
                    })}
                  </div>

                  {slotTime && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      ✓ Appointment selected for {appointmentDate} at {slotTime}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Finance Section */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Financial Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-600">
            <div className="flex flex-col gap-1">
              <p>Consultation Fees (₹)</p>
              <input
                type="number"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                className="border rounded px-3 py-2"
                min="0"
              />
            </div>

            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={xray}
                onChange={(e) => setXray(e.target.checked)}
                className="w-4 h-4"
              />
              <label className="text-sm">X-Ray Required (₹100)</label>
            </div>

            <div className="flex flex-col gap-1">
              <p>Treatment Description</p>
              <input
                type="text"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                className="border rounded px-3 py-2"
                placeholder="Treatment details"
              />
            </div>

            <div className="flex flex-col gap-1">
              <p>Cost of Treatment (₹)</p>
              <input
                type="number"
                value={costOfTreatment}
                onChange={(e) => setCostOfTreatment(e.target.value)}
                className="border rounded px-3 py-2"
                min="0"
              />
            </div>

            <div className="flex flex-col gap-1">
              <p>Medicine Cost (₹)</p>
              <input
                type="number"
                value={medicine}
                onChange={(e) => setMedicine(e.target.value)}
                className="border rounded px-3 py-2"
                min="0"
              />
            </div>

            <div className="flex flex-col gap-1">
              <p>Amount Received (₹)</p>
              <input
                type="number"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                className="border rounded px-3 py-2"
                min="0"
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-semibold">Total Cost (₹)</p>
              <input
                type="number"
                value={total}
                className="border rounded px-3 py-2 bg-gray-100 font-semibold"
                readOnly
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-semibold text-red-600">Balance Due (₹)</p>
              <input
                type="number"
                value={total - received}
                className="border rounded px-3 py-2 bg-red-50 font-semibold text-red-600"
                readOnly
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="bg-primary text-white py-3 px-10 rounded-full mt-6 w-fit">
          Add Patient
        </button>
      </div>
    </form>
  );
};

export default AddPatient;
