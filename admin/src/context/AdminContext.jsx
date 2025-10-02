import {
  createContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AdminContext = createContext();

// Constants
const API_ENDPOINTS = {
  DOCTORS: "/api/admin/all-doctors",
  PATIENTS: "/api/admin/all-patients",
  APPOINTMENTS: "/api/admin/appointments",
  DASHBOARD: "/api/admin/dashboard",
  CHANGE_AVAILABILITY: "/api/admin/change-availability",
  CANCEL_APPOINTMENT: "/api/admin/cancel-appointment",
  PATIENT: "/api/admin/patient",
  LOGOUT: "/api/admin/logout",
};

const AdminContextProvider = ({ children }) => {
  // State management - Changed from token to boolean authentication state
  const [aToken, setAtoken] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState({
    doctors: false,
    patients: false,
    appointments: false,
    dashboard: false,
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Utility function for consistent error handling
  const handleApiError = useCallback((error, fallbackMessage) => {
    const message = error.response?.data?.message || fallbackMessage;
    toast.error(message);
    console.error("API Error:", error);

    // If unauthorized, reset auth state
    if (error.response?.status === 401) {
      setAtoken(false);
    }

    return message;
  }, []);

  // Generic API call wrapper with loading state - Updated for cookies
  const makeApiCall = useCallback(async (apiCall, loadingKey, onSuccess) => {
    try {
      setLoading((prev) => ({ ...prev, [loadingKey]: true }));
      const response = await apiCall();
      if (onSuccess) onSuccess(response);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  }, []);

  // Updated axios config - No more headers, just withCredentials for cookies
  const axiosConfig = useMemo(
    () => ({
      withCredentials: true, // This sends httpOnly cookies automatically
      headers: {
        "Content-Type": "application/json",
      },
    }),
    []
  );

  // Updated axios config for multipart form data
  const axiosConfigMultipart = useMemo(
    () => ({
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
    []
  );

  const getAllDoctors = useCallback(async () => {
    try {
      await makeApiCall(
        () => axios.get(`${backendUrl}${API_ENDPOINTS.DOCTORS}`, axiosConfig),
        "doctors",
        ({ data }) => {
          if (data.success) {
            setDoctors(data.doctors);
            console.log("Fetched doctors:", data.doctors);
          } else {
            toast.error(data.message);
          }
        }
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch doctors");
    }
  }, [backendUrl, axiosConfig, makeApiCall, handleApiError]);

  const getAllPatients = useCallback(async () => {
    try {
      await makeApiCall(
        () => axios.get(`${backendUrl}${API_ENDPOINTS.PATIENTS}`, axiosConfig),
        "patients",
        ({ data }) => {
          if (data.success) {
            setPatients(data.patients);
          } else {
            toast.error(data.message);
          }
        }
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch patients");
    }
  }, [backendUrl, axiosConfig, makeApiCall, handleApiError]);

  const changeAvailability = useCallback(
    async (docId) => {
      if (!docId) {
        toast.error("Doctor ID is required");
        return;
      }

      try {
        const { data } = await axios.post(
          `${backendUrl}${API_ENDPOINTS.CHANGE_AVAILABILITY}`,
          { docId },
          axiosConfig
        );

        if (data.success) {
          toast.success(data.message);
          await getAllDoctors();
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        handleApiError(error, "Failed to change availability");
      }
    },
    [backendUrl, axiosConfig, getAllDoctors, handleApiError]
  );

  const getAllAppointments = useCallback(async () => {
    try {
      await makeApiCall(
        () =>
          axios.get(`${backendUrl}${API_ENDPOINTS.APPOINTMENTS}`, axiosConfig),
        "appointments",
        ({ data }) => {
          if (data.success) {
            setAppointments(data.appointments);
          } else {
            toast.error(data.message);
          }
        }
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch appointments");
    }
  }, [backendUrl, axiosConfig, makeApiCall, handleApiError]);

  const cancelAppointment = useCallback(
    async (appointmentId) => {
      if (!appointmentId) {
        toast.error("Appointment ID is required");
        return;
      }

      try {
        const { data } = await axios.post(
          `${backendUrl}${API_ENDPOINTS.CANCEL_APPOINTMENT}`,
          { appointmentId },
          axiosConfig
        );

        if (data.success) {
          toast.success(data.message);
          await getAllAppointments();
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        handleApiError(error, "Failed to cancel appointment");
      }
    },
    [backendUrl, axiosConfig, getAllAppointments, handleApiError]
  );

  const getDashData = useCallback(async () => {
    try {
      await makeApiCall(
        () => axios.get(`${backendUrl}${API_ENDPOINTS.DASHBOARD}`, axiosConfig),
        "dashboard",
        ({ data }) => {
          if (data.success) {
            setDashData(data.dashData);
            console.log("Fetched dashboard data:", data.dashData);
          } else {
            toast.error(data.message);
          }
        }
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch dashboard data");
    }
  }, [backendUrl, axiosConfig, makeApiCall, handleApiError]);

  const deletePatient = useCallback(
    async (patientId) => {
      if (!patientId) {
        toast.error("Patient ID is required");
        return false;
      }

      try {
        const { data } = await axios.delete(
          `${backendUrl}${API_ENDPOINTS.PATIENT}/${patientId}`,
          axiosConfig
        );

        if (data.success) {
          toast.success(data.message);
          setPatients((prev) =>
            prev.filter((patient) => patient._id !== patientId)
          );
          return true;
        } else {
          toast.error(data.message);
          return false;
        }
      } catch (error) {
        handleApiError(error, "Failed to delete patient");
        return false;
      }
    },
    [backendUrl, axiosConfig, handleApiError]
  );

  const updatePatient = useCallback(
    async (patientId, formData) => {
      if (!patientId) {
        toast.error("Patient ID is required");
        throw new Error("Patient ID is required");
      }

      try {
        const { data } = await axios.put(
          `${backendUrl}${API_ENDPOINTS.PATIENT}/${patientId}`,
          formData,
          axiosConfigMultipart // Use multipart config
        );

        if (data.success) {
          toast.success(data.message);
          await getAllPatients();
          await getAllAppointments();
          return data;
        } else {
          toast.error(data.message);
          throw new Error(data.message);
        }
      } catch (error) {
        handleApiError(error, "Failed to update patient");
        throw error;
      }
    },
    [
      backendUrl,
      axiosConfigMultipart,
      handleApiError,
      getAllPatients,
      getAllAppointments,
    ]
  );

  // Check authentication status by making a test API call
  const checkAuthStatus = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${backendUrl}${API_ENDPOINTS.DASHBOARD}`,
        axiosConfig
      );
      if (data.success) {
        setAtoken(true);
        return true;
      } else {
        setAtoken(false);
        return false;
      }
    } catch (error) {
      setAtoken(false);
      return false;
    }
  }, [backendUrl, axiosConfig]);

  // Utility function to check if user is authenticated
  const isAuthenticated = useMemo(() => Boolean(aToken), [aToken]);

  // Updated logout function - calls backend to clear httpOnly cookie
  const logout = useCallback(async () => {
    try {
      // Call backend logout to clear httpOnly cookie
      await axios.post(`${backendUrl}${API_ENDPOINTS.LOGOUT}`, {}, axiosConfig);
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Continue with local cleanup even if API call fails
    }

    // Clear local state
    setAtoken(false);
    setDoctors([]);
    setAppointments([]);
    setPatients([]);
    setDashData(null);
    toast.success("Logged out successfully");
  }, [backendUrl, axiosConfig]);

  // Check auth status on app load
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      // Authentication
      aToken,
      setAtoken,
      isAuthenticated,
      logout,
      checkAuthStatus,

      // Configuration
      backendUrl,

      // Data
      doctors,
      appointments,
      dashData,
      patients,
      loading,

      // Methods
      getAllDoctors,
      changeAvailability,
      getAllAppointments,
      cancelAppointment,
      getDashData,
      getAllPatients,
      deletePatient,
      updatePatient,

      // Deprecated - keeping for backward compatibility
      setAppointments,
    }),
    [
      aToken,
      setAtoken,
      isAuthenticated,
      logout,
      checkAuthStatus,
      backendUrl,
      doctors,
      appointments,
      dashData,
      patients,
      loading,
      getAllDoctors,
      changeAvailability,
      getAllAppointments,
      cancelAppointment,
      getDashData,
      getAllPatients,
      deletePatient,
      updatePatient,
    ]
  );

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
