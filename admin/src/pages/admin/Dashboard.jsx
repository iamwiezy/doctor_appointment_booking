import React, { useContext, useEffect } from "react";
import { AdminContext } from "../../context/AdminContext";
import { assets } from "../../assets/assets";

const Dashboard = () => {
  const { aToken, dashData, getDashData, cancelAppointment } =
    useContext(AdminContext);

  useEffect(() => {
    if (aToken) {
      getDashData();
    }
  }, [aToken]);

  if (!dashData) return null;

  return (
    <div className="m-5">
      {/* Top Stats */}
      <div className="flex flex-wrap gap-3">
        {[
          {
            icon: assets.doctor_icon,
            count: dashData.doctors,
            label: "Doctors",
          },
          {
            icon: assets.appointments_icon,
            count: dashData.appointments,
            label: "Appointments",
          },
          {
            icon: assets.patients_icon,
            count: dashData.patients,
            label: "Patients",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-200 cursor-pointer hover:scale-105 transition-all"
          >
            <img className="w-14" src={item.icon} alt={item.label} />
            <div>
              <p className="text-xl font-semibold text-gray-600">
                {item.count}
              </p>
              <p className="text-gray-400">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Latest Bookings */}
      <div className="bg-white">
        <div className="flex items-center gap-2.5 px-4 py-4 mt-10 rounded-t border">
          <img src={assets.list_icon} alt="list" />
          <p className="font-semibold">Latest Bookings</p>
        </div>
        <div className="pt-4 border border-t-0">
          {dashData.latestAppointments?.map((item, index) => (
            <div
              key={index}
              className="flex items-center px-6 py-3 gap-3 hover:bg-gray-100"
            >
              <img
                className="rounded-full w-10"
                src={item.docData.image}
                alt={item.docData.name}
              />
              <div className="flex-1 text-sm">
                <p className="text-gray-800 font-medium">{item.docData.name}</p>
                <p className="text-gray-600">{item.slotDate}</p>
              </div>
              {item?.cancelled ? (
                <span className="text-red-500 font-medium text-sm">
                  Cancelled
                </span>
              ) : item.isCompleted ? (
                <p className="text-green-500 font-medium text-sm">Completed</p>
              ) : (
                <button
                  onClick={() => cancelAppointment(item._id)}
                  className="p-2"
                  title="Cancel Appointment"
                >
                  <img
                    src={assets.cancel_icon}
                    alt="Cancel"
                    className="w-10 h-10"
                  />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
