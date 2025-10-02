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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              Admin Dashboard
            </h1>
            <p className="text-gray-500">
              Welcome back 👋 Here’s today’s clinic overview.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
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
            className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer">
            <img className="w-14 h-14" src={item.icon} alt={item.label} />
            <div>
              <p className="text-2xl font-bold text-gray-800">{item.count}</p>
              <p className="text-gray-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Latest Bookings */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200">
        <div className="flex items-center gap-2 px-6 py-4 border-b bg-gray-50 rounded-t-2xl">
          <img src={assets.list_icon} alt="list" />
          <p className="font-semibold text-gray-800 text-lg">Latest Bookings</p>
        </div>
        <div className="divide-y divide-gray-100">
          {dashData.latestAppointments?.map((item, index) => (
            <div
              key={index}
              className="flex items-center px-6 py-5 hover:bg-gray-50 transition-colors">
              {/* Doctor Info */}
              <div className="flex items-center gap-3 flex-1">
                <img
                  className="rounded-full w-12 h-12 object-cover border border-gray-200"
                  src={item.docData.image}
                  alt={item.docData.name}
                />
                <div>
                  <p className="text-gray-800 font-medium">
                    Dr. {item.docData.name}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {item.docData.speciality}
                  </p>
                </div>
              </div>

              {/* Patient Info */}
              <div className="flex-1 px-4">
                <p className="text-gray-800 font-medium">
                  Patient: {item.userData?.name || "N/A"}
                </p>
                <p className="text-gray-500 text-sm">
                  Phone: +91 {item.userData?.phone || "No email"}
                </p>
              </div>

              {/* Appointment Details */}
              <div className="flex-1 px-4">
                <p className="text-gray-800 font-medium">{item.slotDate}</p>
                <p className="text-gray-500 text-sm">{item.slotTime}</p>
              </div>

              {/* Status/Action */}
              <div className="flex items-center">
                {item?.cancelled ? (
                  <span className="text-red-600 font-medium text-sm bg-red-100 px-3 py-1 rounded-full">
                    Cancelled
                  </span>
                ) : item.isCompleted ? (
                  <span className="text-green-600 font-medium text-sm bg-green-100 px-3 py-1 rounded-full">
                    Completed
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-medium text-sm bg-blue-100 px-3 py-1 rounded-full">
                      Scheduled
                    </span>
                    <button
                      onClick={() => cancelAppointment(item._id)}
                      className="p-2 hover:bg-red-50 rounded-full transition-colors"
                      title="Cancel Appointment">
                      <img
                        src={assets.cancel_icon}
                        alt="Cancel"
                        className="w-6 h-6"
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {(!dashData.latestAppointments ||
          dashData.latestAppointments.length === 0) && (
          <div className="px-6 py-12 text-center text-gray-500">
            <p className="text-base">No recent appointments found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
