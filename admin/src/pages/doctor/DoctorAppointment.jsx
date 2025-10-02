import React, { useContext, useEffect } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";

const DoctorAppointment = () => {
  const {
    dToken,
    appointments,
    getAppointments,
    completeAppointment,
    cancelAppointment,
  } = useContext(DoctorContext);

  const { calculateAge, slotDateFormat } = useContext(AppContext);

  useEffect(() => {
    if (dToken) {
      getAppointments();
    }
  }, [dToken]);

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

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">All Appointments</p>

      <div className="bg-white border rounded text-sm max-h-[80vh] min-h-[50vh] overflow-y-scroll">
        {/* Table Header */}
        <div className="max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_2fr_1fr_1fr_2fr_2fr_1fr] gap-1 py-3 px-6 border-b font-medium text-gray-700">
          <p>#</p>
          <p>Patient</p>
          <p>Contact</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Gender</p>
          <p>Address</p>
          <p>Medical History</p>
          <p>Actions</p>
        </div>

        {/* Table Rows */}
        {appointments.map((item, index) => (
          <div
            key={index}
            className="flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_2fr_1fr_1fr_2fr_2fr_1fr] gap-1 items-center text-gray-600 py-3 px-6 border-b hover:bg-gray-50">
            {/* Index */}
            <p className="max-sm:hidden">{index + 1}</p>

            {/* Patient */}
            <div className="flex items-center gap-2">
              <img
                className="w-8 h-8 rounded-full object-cover"
                src={item.userData?.image || assets.default_user}
                alt="patient"
              />
              <p>{item.userData?.name || "N/A"}</p>
            </div>

            {/* Contact */}
            <p>{item.userData?.phone || "N/A"}</p>

            {/* Age */}
            <p className="max-sm:hidden">
              {item.userData?.dob ? calculateAge(item.userData.dob) : "N/A"}
            </p>

            {/* Date & Time */}
            <p>
              {slotDateFormat(item.slotDate)}, {item.slotTime}
            </p>

            {/* Fees */}
            <p>{item.userData?.totalFees || "0"}</p>

            {/* Gender */}
            <p>{item.userData?.gender || "N/A"}</p>

            {/* Address */}
            <p>{formatAddress(item.userData?.address)}</p>

            {/* Medical History */}
            <p>{item.userData?.medicalHistory || "N/A"}</p>

            {/* Actions */}
            {item.cancelled ? (
              <p className="text-red-500 font-medium">Cancelled</p>
            ) : item.isCompleted ? (
              <p className="text-green-500 font-medium">Completed</p>
            ) : (
              <div className="flex gap-2">
                <img
                  onClick={() => cancelAppointment(item._id)}
                  className="w-8 cursor-pointer"
                  src={assets.cancel_icon}
                  alt="cancel"
                />
                <img
                  onClick={() => completeAppointment(item._id)}
                  className="w-8 cursor-pointer"
                  src={assets.tick_icon}
                  alt="complete"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorAppointment;
