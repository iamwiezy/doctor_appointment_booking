import React, { useContext, useEffect, useState } from "react";
import { AdminContext } from "../../context/AdminContext";

const PatientsList = () => {
  const {
    patients,
    getAllPatients,
    aToken,
    deletePatient,
    updatePatient,
    doctors,
    getAllDoctors,
    appointments,
    getAllAppointments,
  } = useContext(AdminContext);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Inside your Edit modal component (where editForm is managed)
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState("");

  // --- Pagination & Search states ---
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");

  // Updated editForm state
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    address1: "",
    address2: "",
    assignedDoctor: "",
    slotDate: "",
    slotTime: "",
    medicalHistory: "",
    fees: "",
    costOfTreatment: "",
    medicine: "",
    xray: false,
    received: "",
    image: null,
  });

  useEffect(() => {
    if (editForm.assignedDoctor) {
      const doctor = doctors.find((d) => d._id === editForm.assignedDoctor);
      if (doctor) {
        setSelectedDoctor(doctor);
        getAvailableSlots(doctor);
      }
    } else {
      setSelectedDoctor(null);
      setDocSlots([]);
      setSlotIndex(0);
    }
  }, [editForm.assignedDoctor, doctors]);

  const getAvailableSlots = (doc) => {
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
    setSlotIndex(selectedSlotIndex);
    setEditForm((prev) => ({
      ...prev,
      slotDate: docSlots[selectedSlotIndex][0].dateTime
        .toLocaleDateString("en-GB")
        .split("/")
        .join("-"),
      slotTime: time,
    }));
  };

  useEffect(() => {
    if (aToken) {
      getAllPatients();
    }
  }, [aToken]);

  const calculateAge = (dob) => {
    if (!dob) return "N/A";

    const birthDate = new Date(dob);

    // Check if the date is valid
    if (isNaN(birthDate.getTime())) {
      return "N/A";
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    // Ensure age is a valid number
    return isNaN(age) || age < 0 ? "N/A" : age;
  };

  const handleView = (patient) => {
    setSelectedPatient(patient);
    setShowViewModal(true);
  };

  // Updated handleEdit function
  const handleEdit = (patient) => {
    setSelectedPatient(patient);

    // Fetch doctors if not already loaded
    if (!doctors || doctors.length === 0) {
      getAllDoctors();
    }

    // Parse address
    let address1 = "";
    let address2 = "";
    try {
      const parsedAddress =
        typeof patient.address === "string"
          ? JSON.parse(patient.address)
          : patient.address;
      address1 = parsedAddress?.line1 || "";
      address2 = parsedAddress?.line2 || "";
    } catch (error) {
      address1 = patient.address || "";
    }

    // Populate edit form with all fields
    setEditForm({
      name: patient.name || "",
      email: patient.email || "",
      phone: patient.phone || "",
      dob: patient.dob ? patient.dob.split("T")[0] : "",
      gender: patient.gender || "",
      address1,
      address2,
      image: null,
      assignedDoctor:
        patient.assignedDoctor?._id || patient.assignedDoctor || "",
      slotDate: patient.slotDate || "",
      slotTime: patient.slotTime || "",
      medicalHistory: patient.medicalHistory || "",
      fees: patient.fees || "",
      costOfTreatment: patient.costOfTreatment || "",
      medicine: patient.medicine || "",
      xray: patient.xray || false,
      received: patient.received || "",
    });

    setShowEditModal(true);
  };

  const handleDelete = async (patientId, patientName) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${patientName}? This action cannot be undone.`
      )
    ) {
      try {
        await deletePatient(patientId);
        getAllPatients(); // Refresh the list
      } catch (error) {
        console.error("Error deleting patient:", error);
      }
    }
  };
  const closeModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setSelectedPatient(null);
    setEditForm({
      name: "",
      email: "",
      phone: "",
      dob: "",
      gender: "",
      address1: "",
      address2: "",
      assignedDoctor: "",
      slotDate: "",
      slotTime: "",
      medicalHistory: "",
      fees: "",
      costOfTreatment: "",
      medicine: "",
      xray: false,
      received: "",
      image: null,
    });
    setDocSlots([]);
    setSlotIndex(0);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Updated handleEditSubmit function
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Required fields
    if (
      !editForm.name ||
      !editForm.email ||
      !editForm.phone ||
      !editForm.dob ||
      !editForm.gender
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const formData = new FormData();

      // Basic patient information
      formData.append("name", editForm.name);
      formData.append("email", editForm.email);
      formData.append("phone", editForm.phone);
      formData.append("dob", editForm.dob);
      formData.append("gender", editForm.gender);
      formData.append(
        "address",
        JSON.stringify({ line1: editForm.address1, line2: editForm.address2 })
      );

      // Doctor assignment & appointment
      if (editForm.assignedDoctor)
        formData.append("assignedDoctor", editForm.assignedDoctor);
      if (editForm.slotDate) formData.append("slotDate", editForm.slotDate);
      if (editForm.slotTime) formData.append("slotTime", editForm.slotTime);

      // Medical history
      if (editForm.medicalHistory)
        formData.append("medicalHistory", editForm.medicalHistory);

      // Financials
      if (editForm.fees) formData.append("fees", editForm.fees);
      if (editForm.costOfTreatment)
        formData.append("costOfTreatment", editForm.costOfTreatment);
      if (editForm.medicine) formData.append("medicine", editForm.medicine);
      formData.append("xray", editForm.xray); // boolean
      if (editForm.received) formData.append("received", editForm.received);

      // Calculate total
      const total =
        Number(editForm.fees || 0) +
        Number(editForm.costOfTreatment || 0) +
        Number(editForm.medicine || 0) +
        (editForm.xray ? 100 : 0);
      formData.append("total", total);

      // Image upload
      if (editForm.image) formData.append("image", editForm.image);

      // Call API
      await updatePatient(selectedPatient._id, formData);

      // Close modal and reset form
      closeModals();
    } catch (error) {
      console.error("Error updating patient:", error);
      alert("Error updating patient. Please try again.");
    }
  };

  // Then add useEffect to fetch doctors when component mounts:
  useEffect(() => {
    if (aToken) {
      getAllPatients();
      getAllDoctors(); // Add this line to fetch doctors
    }
  }, [aToken]);
  const formatAddress = (address) => {
    if (!address) return "N/A";

    try {
      const parsedAddress =
        typeof address === "string" ? JSON.parse(address) : address;
      return `${parsedAddress.line1}${
        parsedAddress.line2 ? `, ${parsedAddress.line2}` : ""
      }`;
    } catch (error) {
      return address;
    }
  };

  const filteredPatients = patients?.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.phone?.toLowerCase().includes(term)
    );
  });

  // --- Pagination logic ---
  const totalPages = Math.ceil(
    (filteredPatients?.length || 0) / patientsPerPage
  );
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients?.slice(
    indexOfFirstPatient,
    indexOfLastPatient
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="m-5 overflow-auto">
      <h1 className="text-xl font-medium mb-5">All Patients</h1>

      {/* 🔍 Search Bar */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search patients by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // reset to first page when searching
          }}
          className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setSearchTerm("")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
          Clear
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-auto">
        <div className="overflow-x-auto max-h-[80vh]">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medical History
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Fees (₹)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fees Received (₹)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance (₹)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients && patients.length > 0 ? (
                patients.map((patient, index) => (
                  <tr key={patient._id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {/* <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={patient.image}
                            alt={patient.name}
                          />
                        </div> */}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.phone || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {calculateAge(patient.dob)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          patient.gender === "Male"
                            ? "bg-blue-100 text-blue-800"
                            : patient.gender === "Female"
                            ? "bg-pink-100 text-pink-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                        {patient.gender || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {formatAddress(patient.address)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.assignedDoctor ? (
                        <p>Dr. {patient.assignedDoctor.name}</p>
                      ) : (
                        <p>No doctor assigned</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.medicalHistory || "N/A"}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹ {patient.total || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹ {patient.received || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹ {patient.balanceDue || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(patient)}
                          className="text-indigo-600 hover:text-indigo-900 text-xs bg-indigo-50 px-2 py-1 rounded">
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(patient)}
                          className="text-green-600 hover:text-green-900 text-xs bg-green-50 px-2 py-1 rounded">
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(patient._id, patient.name)
                          }
                          className="text-red-600 hover:text-red-900 text-xs bg-red-50 px-2 py-1 rounded">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center text-gray-500">
                    <div className="text-center">
                      <p className="text-lg">No patients found</p>
                      <p className="text-sm mt-2">
                        Add your first patient to get started
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {patients && patients.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Previous
                </button>
                <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to{" "}
                    <span className="font-medium">{patients.length}</span> of{" "}
                    <span className="font-medium">{patients.length}</span>{" "}
                    results
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Patient Modal */}
      {/* View Patient Modal (Full Details) */}
      {showViewModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Patient Details
              </h3>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {/* Top section: Profile + Quick facts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile card */}
                <div className="md:col-span-1">
                  <div className="border rounded-lg p-4">
                    <div className="text-center">
                      <h4 className="mt-3 text-base font-semibold text-gray-900">
                        {selectedPatient.name || "N/A"}
                      </h4>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium
                    ${
                      selectedPatient.gender === "Male"
                        ? "bg-blue-100 text-blue-800"
                        : selectedPatient.gender === "Female"
                        ? "bg-pink-100 text-pink-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                          {selectedPatient.gender || "N/A"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Age: {calculateAge(selectedPatient.dob)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="w-20 text-gray-500">Email</span>
                        <span className="text-gray-900 break-all">
                          {selectedPatient.email || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-20 text-gray-500">Phone</span>
                        <span className="text-gray-900">
                          {selectedPatient.phone || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-20 text-gray-500">DOB</span>
                        <span className="text-gray-900">
                          {selectedPatient.dob
                            ? new Date(selectedPatient.dob).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-20 text-gray-500">Address</span>
                        <span className="text-gray-900">
                          {formatAddress(selectedPatient.address)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick facts / Doctor & Appointment */}
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Doctor */}
                    <div className="border rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">
                        Assigned Doctor
                      </h5>
                      <div className="text-gray-900">
                        {selectedPatient.assignedDoctor?.name ||
                          (Array.isArray(doctors)
                            ? doctors.find(
                                (d) => d._id === selectedPatient.assignedDoctor
                              )?.name
                            : null) ||
                          "No doctor assigned"}
                      </div>
                      {selectedPatient.assignedDoctor?.speciality && (
                        <div className="text-sm text-gray-500">
                          {selectedPatient.assignedDoctor.speciality}
                        </div>
                      )}
                    </div>

                    {/* Appointment */}
                    <div className="border rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">
                        Appointment
                      </h5>
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Date</span>
                          <span className="text-gray-900">
                            {selectedPatient.appointmentDate || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Time</span>
                          <span className="text-gray-900">
                            {selectedPatient.appointmentTime || "N/A"}
                          </span>
                        </div>
                        {selectedPatient.slotTime && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Selected Slot</span>
                            <span className="text-gray-900">
                              {selectedPatient.slotTime}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Medical History */}
                  <div className="border rounded-lg p-4 mt-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">
                      Medical History
                    </h5>
                    <p className="text-sm text-gray-900 whitespace-pre-line">
                      {selectedPatient.medicalHistory || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financials */}
              <div className="mt-6">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">
                  Financial Summary
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-xs text-gray-500">
                      Consultation Fees
                    </div>
                    <div className="text-base font-semibold text-gray-900">
                      ₹ {Number(selectedPatient.fees || 0)}
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-xs text-gray-500">Treatment Cost</div>
                    <div className="text-base font-semibold text-gray-900">
                      ₹ {Number(selectedPatient.costOfTreatment || 0)}
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-xs text-gray-500">Medicine</div>
                    <div className="text-base font-semibold text-gray-900">
                      ₹ {Number(selectedPatient.medicine || 0)}
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-xs text-gray-500">X-Ray</div>
                    <div className="text-base font-semibold text-gray-900">
                      {selectedPatient.xray
                        ? "Required (₹100)"
                        : "Not required"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-lg font-bold text-gray-900">
                      ₹ {Number(selectedPatient.total || 0)}
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 bg-green-50">
                    <div className="text-xs text-gray-600">Received</div>
                    <div className="text-lg font-bold text-green-700">
                      ₹ {Number(selectedPatient.received || 0)}
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 bg-red-50">
                    <div className="text-xs text-gray-600">Balance</div>
                    <div className="text-lg font-bold text-red-700">
                      ₹{" "}
                      {Math.max(
                        0,
                        Number(selectedPatient.total || 0) -
                          Number(selectedPatient.received || 0)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex justify-end">
              <button
                onClick={closeModals}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {/* Enhanced Edit Patient Modal */}
      {showEditModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Patient Details
              </h3>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleEditSubmit}>
              <div className="p-6 max-h-[75vh] overflow-y-auto">
                {/* Top section: Profile + Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Profile card */}
                  <div className="md:col-span-1">
                    <div className="border rounded-lg p-4">
                      {/* <div className="text-center">
                        <div className="relative mx-auto w-24 h-24">
                          <img
                            src={
                              editForm.image
                                ? URL.createObjectURL(editForm.image)
                                : selectedPatient.image ||
                                  "https://via.placeholder.com/120"
                            }
                            alt="Patient"
                            className="w-24 h-24 rounded-full object-cover mx-auto"
                          />
                          <label
                            htmlFor="edit-patient-img"
                            className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 cursor-pointer hover:bg-blue-600">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </label>
                        </div>
                        <input
                          type="file"
                          id="edit-patient-img"
                          hidden
                          accept="image/*"
                          onChange={(e) =>
                            handleEditFormChange("image", e.target.files[0])
                          }
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Click + to change photo
                        </p>
                      </div> */}

                      <div className="mt-4 space-y-3">
                        {/* Patient Name */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Patient Name *
                          </label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) =>
                              handleEditFormChange("name", e.target.value)
                            }
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        {/* Gender */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Gender *
                          </label>
                          <select
                            value={editForm.gender}
                            onChange={(e) =>
                              handleEditFormChange("gender", e.target.value)
                            }
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* Date of Birth */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Date of Birth *
                          </label>
                          <input
                            type="date"
                            value={editForm.dob}
                            onChange={(e) =>
                              handleEditFormChange("dob", e.target.value)
                            }
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Address Info */}
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Contact Information */}
                      <div className="border rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3">
                          Contact Information
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Email *
                            </label>
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) =>
                                handleEditFormChange("email", e.target.value)
                              }
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Phone *
                            </label>
                            <input
                              type="tel"
                              value={editForm.phone}
                              onChange={(e) =>
                                handleEditFormChange("phone", e.target.value)
                              }
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Address Information */}
                      <div className="border rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3">
                          Address Information
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Address Line 1 *
                            </label>
                            <input
                              type="text"
                              value={editForm.address1}
                              onChange={(e) =>
                                handleEditFormChange("address1", e.target.value)
                              }
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Street address"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Address Line 2
                            </label>
                            <input
                              type="text"
                              value={editForm.address2}
                              onChange={(e) =>
                                handleEditFormChange("address2", e.target.value)
                              }
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Apartment, suite, etc."
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Medical & Appointment Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                      {/* Doctor Assignment */}
                      <div className="border rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3">
                          Assigned Doctor
                        </h5>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Select Doctor
                          </label>
                          <select
                            value={editForm.assignedDoctor || ""}
                            onChange={(e) =>
                              handleEditFormChange(
                                "assignedDoctor",
                                e.target.value
                              )
                            }
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">No doctor assigned</option>
                            {Array.isArray(doctors) &&
                              doctors.map((doctor) => (
                                <option key={doctor._id} value={doctor._id}>
                                  {doctor.name} - {doctor.speciality}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      {/* Appointment Details */}
                      <div className="border rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3">
                          Appointment Details
                        </h5>

                        {editForm.assignedDoctor ? (
                          <>
                            {/* Slot Days Navigation */}
                            <div className="flex justify-between items-center mb-3">
                              <button
                                type="button"
                                disabled={slotIndex === 0}
                                onClick={() =>
                                  setSlotIndex((prev) => Math.max(0, prev - 1))
                                }
                                className="px-2 py-1 text-xs border rounded disabled:opacity-50">
                                Prev
                              </button>
                              <span className="text-sm font-medium">
                                {docSlots[
                                  slotIndex
                                ]?.[0]?.dateTime.toLocaleDateString(
                                  "en-GB"
                                )}{" "}
                                (
                                {
                                  daysOfWeek[
                                    docSlots[slotIndex]?.[0]?.dateTime.getDay()
                                  ]
                                }
                                )
                              </span>
                              <button
                                type="button"
                                disabled={slotIndex === docSlots.length - 1}
                                onClick={() =>
                                  setSlotIndex((prev) =>
                                    Math.min(docSlots.length - 1, prev + 1)
                                  )
                                }
                                className="px-2 py-1 text-xs border rounded disabled:opacity-50">
                                Next
                              </button>
                            </div>

                            {/* Time Slots */}
                            <div className="grid grid-cols-3 gap-2">
                              {docSlots[slotIndex]?.map((slot, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  disabled={slot.isBooked}
                                  onClick={() =>
                                    handleSlotSelection(slot.time, slotIndex)
                                  }
                                  className={`px-2 py-1 rounded text-xs ${
                                    slot.isBooked
                                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                      : editForm.appointmentTime ===
                                          slot.time &&
                                        editForm.appointmentDate ===
                                          slot.dateTime.toLocaleDateString(
                                            "en-GB"
                                          )
                                      ? "bg-blue-500 text-white"
                                      : "bg-gray-100 hover:bg-blue-100"
                                  }`}>
                                  {slot.time}
                                </button>
                              ))}
                            </div>

                            {/* Selected Slot */}
                            {editForm.appointmentDate &&
                              editForm.appointmentTime && (
                                <p className="text-xs text-gray-600 mt-2">
                                  Selected:{" "}
                                  <strong>{editForm.appointmentDate}</strong> at{" "}
                                  <strong>{editForm.appointmentTime}</strong>
                                </p>
                              )}
                          </>
                        ) : (
                          <p className="text-xs text-gray-500">
                            Assign a doctor to book slots.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Medical History */}
                    <div className="border rounded-lg p-4 mt-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">
                        Medical History
                      </h5>
                      <textarea
                        value={editForm.medicalHistory || ""}
                        onChange={(e) =>
                          handleEditFormChange("medicalHistory", e.target.value)
                        }
                        rows="3"
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter medical history, allergies, previous treatments, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="mt-6">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3">
                    Financial Information
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="border rounded-lg p-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Consultation Fees (₹)
                      </label>
                      <input
                        type="number"
                        value={editForm.fees || ""}
                        onChange={(e) =>
                          handleEditFormChange("fees", e.target.value)
                        }
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                    <div className="border rounded-lg p-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Treatment Cost (₹)
                      </label>
                      <input
                        type="number"
                        value={editForm.costOfTreatment || ""}
                        onChange={(e) =>
                          handleEditFormChange(
                            "costOfTreatment",
                            e.target.value
                          )
                        }
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                    <div className="border rounded-lg p-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Medicine Cost (₹)
                      </label>
                      <input
                        type="number"
                        value={editForm.medicine || ""}
                        onChange={(e) =>
                          handleEditFormChange("medicine", e.target.value)
                        }
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                    <div className="border rounded-lg p-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        X-Ray Required
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editForm.xray || false}
                          onChange={(e) =>
                            handleEditFormChange("xray", e.target.checked)
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600">
                          {editForm.xray ? "Yes (₹100)" : "Not required"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="text-xs text-gray-500 mb-1">
                        Total Amount
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        ₹{" "}
                        {Number(editForm.fees || 0) +
                          Number(editForm.costOfTreatment || 0) +
                          Number(editForm.medicine || 0) +
                          (editForm.xray ? 100 : 0)}
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Amount Received (₹)
                      </label>
                      <input
                        type="number"
                        value={editForm.received || ""}
                        onChange={(e) =>
                          handleEditFormChange("received", e.target.value)
                        }
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                    <div className="border rounded-lg p-4 bg-red-50">
                      <div className="text-xs text-gray-600 mb-1">
                        Balance Due
                      </div>
                      <div className="text-lg font-bold text-red-700">
                        ₹{" "}
                        {Math.max(
                          0,
                          Number(editForm.fees || 0) +
                            Number(editForm.costOfTreatment || 0) +
                            Number(editForm.medicine || 0) +
                            (editForm.xray ? 100 : 0) -
                            Number(editForm.received || 0)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Pagination Controls --- */}
      {filteredPatients?.length > 0 && (
        <div className="px-4 py-3 flex items-center justify-between border-t bg-gray-50">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50">
            Previous
          </button>

          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PatientsList;
