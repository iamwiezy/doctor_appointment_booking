import React, { useContext, useEffect } from "react";
import { AdminContext } from "../../context/AdminContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";

const AllAppointments = () => {
  const { aToken, appointments, getAllAppointments, cancelAppointment } =
    useContext(AdminContext);
  const { calculateAge, slotDateFormat, currency } = useContext(AppContext);

  useEffect(() => {
    if (aToken) {
      getAllAppointments();
    }
  }, [aToken]);

  return (
    <div className="w-full max-w-6xl mx-auto my-6">
      <h2 className="mb-5 text-xl font-semibold text-zinc-800">
        All Appointments
      </h2>

      <div className="bg-white shadow-md rounded-lg text-sm max-h-[80vh] overflow-y-auto border border-zinc-200">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[0.5fr_2.5fr_1fr_2fr_2.5fr_1fr_1fr] px-6 py-3 text-zinc-500 font-medium border-b bg-zinc-50">
          <p>#</p>
          <p>Patient Name</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p>Fees</p>
          <p>Actions</p>
        </div>

        {/* Empty State */}
        {appointments.length === 0 ? (
          <div className="p-6 text-center text-zinc-500">
            No appointments available.
          </div>
        ) : (
          appointments
            .slice() // ✅ makes a copy (avoids mutating original state)
            .reverse()
            .map((item, index) => (
              <div
                key={item._id || index}
                className="flex flex-wrap justify-between items-center sm:grid sm:grid-cols-[0.5fr_2.5fr_1fr_2fr_2.5fr_1fr_1fr] px-6 py-4 text-zinc-600 border-b hover:bg-zinc-50 transition">
                <p className="max-sm:hidden">{index + 1}</p>

                <div className="flex items-center gap-3">
                  {/* <img
                    className="w-8 h-8 rounded-full object-cover"
                    src={item?.userData?.image || ""}
                    alt="patient"
                  /> */}
                  <span className="font-medium text-zinc-700">
                    {item?.userData?.name || "Unknown"}
                  </span>
                </div>

                <p className="max-sm:hidden">
                  {calculateAge(item?.userData?.dob) || "-"}
                </p>

                <p>
                  {slotDateFormat(item?.slotDate) || "-"},{" "}
                  {item?.slotTime || "-"}
                </p>

                <div className="flex items-center gap-3">
                  <img
                    className="w-8 h-8 rounded-full bg-gray-100 object-cover"
                    src={item?.docData?.image || ""}
                    alt="doctor"
                  />
                  <span className="font-medium text-zinc-700">
                    {item?.docData?.name || "Unknown"}
                  </span>
                </div>

                <p className="font-semibold text-zinc-700">
                  {currency} {item?.userData?.total || "0"}
                </p>

                {/* Cancel Button or Cancelled Status */}
                {item?.cancelled ? (
                  <span className="text-red-500 font-medium text-sm">
                    Cancelled
                  </span>
                ) : item.isCompleted ? (
                  <p className="text-green-500 font-medium text-sm">
                    Completed
                  </p>
                ) : (
                  <button
                    onClick={() => cancelAppointment(item._id)} // ✅ Wrapped in arrow function
                    className="p-2 "
                    title="Cancel Appointment">
                    <img
                      src={assets.cancel_icon}
                      alt="Cancel"
                      className="w-10 h-10"
                    />
                  </button>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default AllAppointments;
