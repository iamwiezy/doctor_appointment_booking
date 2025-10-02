import { useState, useCallback, useMemo } from "react";
import { createContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Changed from token string to boolean authentication state
  const [dToken, setDToken] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(false);
  const [profileData, setProfileData] = useState(false);
  const [loading, setLoading] = useState({
    appointments: false,
    dashboard: false,
    profile: false,
  });

  // Axios config for httpOnly cookies
  const axiosConfig = useMemo(
    () => ({
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }),
    []
  );

  // Error handler
  const handleApiError = useCallback((error, context) => {
    console.error(`${context} error:`, error);
    if (error.response?.status === 401) {
      setDToken(false);
      toast.error("Session expired. Please login again");
    } else {
      toast.error(error.response?.data?.message || error.message);
    }
  }, []);

  const getAppointments = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, appointments: true }));
      const { data } = await axios.get(
        `${backendUrl}/api/doctor/appointments`,
        axiosConfig
      );

      if (data.success) {
        setAppointments(data.appointments.reverse());
        console.log("Appointments:", data.appointments);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      handleApiError(error, "Get appointments");
    } finally {
      setLoading((prev) => ({ ...prev, appointments: false }));
    }
  }, [backendUrl, axiosConfig, handleApiError]);

  const completeAppointment = useCallback(
    async (appointmentId) => {
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/doctor/complete-appointment`,
          { appointmentId },
          axiosConfig
        );

        if (data.success) {
          toast.success(data.message);
          getAppointments();
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        handleApiError(error, "Complete appointment");
      }
    },
    [backendUrl, axiosConfig, getAppointments, handleApiError]
  );

  const cancelAppointment = useCallback(
    async (appointmentId) => {
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/doctor/cancel-appointment`,
          { appointmentId },
          axiosConfig
        );

        if (data.success) {
          toast.success(data.message);
          getAppointments();
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        handleApiError(error, "Cancel appointment");
      }
    },
    [backendUrl, axiosConfig, getAppointments, handleApiError]
  );

  const getDashData = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, dashboard: true }));
      const { data } = await axios.get(
        `${backendUrl}/api/doctor/dashboard`,
        axiosConfig
      );

      if (data.success) {
        setDashData(data.dashData);
        console.log("Dashboard data:", data.dashData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      handleApiError(error, "Get dashboard data");
    } finally {
      setLoading((prev) => ({ ...prev, dashboard: false }));
    }
  }, [backendUrl, axiosConfig, handleApiError]);

  const getProfileData = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, profile: true }));
      const { data } = await axios.get(
        `${backendUrl}/api/doctor/profile`,
        axiosConfig
      );

      if (data.success) {
        setProfileData(data.profileData);
        console.log("Profile data:", data.profileData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      handleApiError(error, "Get profile data");
    } finally {
      setLoading((prev) => ({ ...prev, profile: false }));
    }
  }, [backendUrl, axiosConfig, handleApiError]);

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/doctor/dashboard`,
        axiosConfig
      );
      if (data.success) {
        setDToken(true);
        return true;
      } else {
        setDToken(false);
        return false;
      }
    } catch (error) {
      setDToken(false);
      return false;
    }
  }, [backendUrl, axiosConfig]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await axios.post(`${backendUrl}/api/doctor/logout`, {}, axiosConfig);
    } catch (error) {
      console.error("Logout API call failed:", error);
    }

    // Clear local state
    setDToken(false);
    setAppointments([]);
    setDashData(false);
    setProfileData(false);
    toast.success("Logged out successfully");
  }, [backendUrl, axiosConfig]);

  // Memoized context value
  const value = useMemo(
    () => ({
      dToken,
      setDToken,
      backendUrl,
      appointments,
      setAppointments,
      getAppointments,
      completeAppointment,
      cancelAppointment,
      dashData,
      setDashData,
      getDashData,
      profileData,
      setProfileData,
      getProfileData,
      checkAuthStatus,
      logout,
      loading,
    }),
    [
      dToken,
      backendUrl,
      appointments,
      dashData,
      profileData,
      loading,
      getAppointments,
      completeAppointment,
      cancelAppointment,
      getDashData,
      getProfileData,
      checkAuthStatus,
      logout,
    ]
  );

  return (
    <DoctorContext.Provider value={value}>
      {props.children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;
