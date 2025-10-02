import React, {
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { AdminContext } from "../context/AdminContext";
import { DoctorContext } from "../context/DoctorContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import happyodent_logo from "../assets/happyodent_logo.png";

// Constants for better maintainability
const USER_ROLES = {
  ADMIN: "Admin",
  DOCTOR: "Doctor",
};

const ENDPOINTS = {
  [USER_ROLES.ADMIN]: "/api/admin/login",
  [USER_ROLES.DOCTOR]: "/api/doctor/login",
};

const NAVIGATION_PATHS = {
  [USER_ROLES.ADMIN]: "/admin-dashboard",
  [USER_ROLES.DOCTOR]: "/doctor-dashboard",
};

// Validation constants
const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 8,
  REQUEST_TIMEOUT: 10000,
  MAX_RETRY_ATTEMPTS: 3,
};

// Error status code mappings
const ERROR_MESSAGES = {
  400: "Invalid request. Please check your input.",
  401: "Invalid email or password. Please check your credentials.",
  403: "Access denied. Please contact administrator.",
  404: "Service unavailable. Please try again later.",
  422: "Invalid input format. Please check your data.",
  429: "Too many login attempts. Please wait before trying again.",
  500: "Server error. Please try again later.",
  502: "Service temporarily unavailable. Please try again.",
  503: "Service under maintenance. Please try again later.",
  NETWORK: "Network error. Please check your connection and try again.",
  TIMEOUT: "Request timed out. Please try again.",
  UNKNOWN: "An unexpected error occurred. Please try again.",
};

const Login = () => {
  // State management
  const [userRole, setUserRole] = useState(USER_ROLES.ADMIN);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Refs for form elements
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const formRef = useRef(null);

  // Context and navigation
  const { setAtoken, backendUrl: adminBackendUrl } = useContext(AdminContext);
  const { setDToken, backendUrl: doctorBackendUrl } = useContext(DoctorContext);
  const navigate = useNavigate();

  // Get backend URL based on role
  const backendUrl = useMemo(() => {
    return (
      adminBackendUrl || doctorBackendUrl || import.meta.env.VITE_BACKEND_URL
    );
  }, [adminBackendUrl, doctorBackendUrl]);

  // Rate limiting check
  const isRateLimited = useMemo(() => {
    if (!lastAttemptTime || loginAttempts < 5) return false;
    const timeSinceLastAttempt = Date.now() - lastAttemptTime;
    return timeSinceLastAttempt < 60000; // 1 minute cooldown
  }, [loginAttempts, lastAttemptTime]);

  // Input validation with detailed feedback
  const validation = useMemo(() => {
    const { email, password } = formData;

    const emailValid = VALIDATION.EMAIL_REGEX.test(email);
    const passwordValid = password.length >= VALIDATION.MIN_PASSWORD_LENGTH;

    return {
      email: {
        valid: emailValid,
        message: emailValid ? "" : "Please enter a valid email address",
      },
      password: {
        valid: passwordValid,
        message: passwordValid
          ? ""
          : `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters long`,
      },
      form: {
        valid: emailValid && passwordValid && !isLoading && !isRateLimited,
        canSubmit: emailValid && passwordValid && !isLoading && !isRateLimited,
      },
    };
  }, [formData, isLoading, isRateLimited]);

  // Role toggle handler with cleanup
  const handleRoleToggle = useCallback(() => {
    setUserRole((prev) =>
      prev === USER_ROLES.ADMIN ? USER_ROLES.DOCTOR : USER_ROLES.ADMIN
    );
    // Clear form and reset attempts when switching roles
    setFormData({ email: "", password: "" });
    setLoginAttempts(0);
    setLastAttemptTime(null);
    setShowPassword(false);

    // Focus first input after role switch
    setTimeout(() => emailRef.current?.focus(), 0);
  }, []);

  // Generic input handler
  const handleInputChange = useCallback(
    (field) => (e) => {
      const value =
        field === "email"
          ? e.target.value.trim().toLowerCase()
          : e.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  // Password visibility toggle
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Enhanced error handling with retry logic
  const getErrorMessage = useCallback((error) => {
    if (error.code === "ECONNABORTED") {
      return ERROR_MESSAGES.TIMEOUT;
    }

    if (error.response) {
      const status = error.response.status;
      return (
        ERROR_MESSAGES[status] ||
        error.response.data?.message ||
        ERROR_MESSAGES.UNKNOWN
      );
    }

    if (error.request) {
      return ERROR_MESSAGES.NETWORK;
    }

    return ERROR_MESSAGES.UNKNOWN;
  }, []);

  // Secure authentication status handler for httpOnly cookies
  // Secure authentication status handler for httpOnly cookies
  const handleAuthenticationSuccess = useCallback(
    (userRole) => {
      try {
        // Clear both tokens first, then set the correct one
        if (userRole === USER_ROLES.ADMIN) {
          setAtoken(true);
          setDToken(false); // ✅ Clear doctor state
        } else {
          setDToken(true);
          setAtoken(false); // ✅ Clear admin state
        }
        return true;
      } catch (error) {
        console.error("Authentication status update failed:", error);
        toast.error("Authentication failed. Please try again.");
        return false;
      }
    },
    [setAtoken, setDToken]
  );

  // Main form submission with enhanced security and httpOnly cookie support
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    // Environment validation
    if (!backendUrl) {
      toast.error("Configuration error. Please contact support.");
      return;
    }

    // Rate limiting check
    if (isRateLimited) {
      toast.error(
        "Too many attempts. Please wait a moment before trying again."
      );
      return;
    }

    // Form validation
    if (!validation.form.canSubmit) {
      if (!validation.email.valid) {
        emailRef.current?.focus();
        toast.error(validation.email.message);
        return;
      }
      if (!validation.password.valid) {
        passwordRef.current?.focus();
        toast.error(validation.password.message);
        return;
      }
    }

    setIsLoading(true);
    setLoginAttempts((prev) => prev + 1);
    setLastAttemptTime(Date.now());

    try {
      const endpoint = `${backendUrl}${ENDPOINTS[userRole]}`;
      const navigationPath = NAVIGATION_PATHS[userRole];

      // Create axios instance with enhanced configuration for httpOnly cookies
      const axiosInstance = axios.create({
        timeout: VALIDATION.REQUEST_TIMEOUT,
        withCredentials: true, // Essential for httpOnly cookies
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // Add request interceptor for debugging in development
        ...(process.env.NODE_ENV === "development" && {
          validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        }),
      });

      // Add request ID for tracking
      const requestId =
        Date.now().toString(36) + Math.random().toString(36).substr(2);

      const { data } = await axiosInstance.post(endpoint, {
        email: formData.email.trim(),
        password: formData.password,
        requestId, // For server-side logging
      });

      // Enhanced response validation for httpOnly cookie authentication
      if (data?.success) {
        // Handle authentication success - no token in response anymore
        const authSuccess = handleAuthenticationSuccess(userRole);

        if (!authSuccess) {
          return; // Error already handled in handleAuthenticationSuccess
        }

        // Clear sensitive data
        setFormData({ email: "", password: "" });
        setLoginAttempts(0);
        setLastAttemptTime(null);

        // Navigate with state
        navigate(navigationPath, {
          state: { loginTime: new Date().toISOString() },
          replace: true, // Prevent back button to login page
        });

        toast.success(`Welcome! ${userRole} login successful.`, {
          autoClose: 3000,
        });
      } else {
        // Handle invalid response structure
        const errorMessage =
          data?.message || "Invalid response from server. Please try again.";
        toast.error(errorMessage);

        // Focus appropriate field based on error
        if (errorMessage.toLowerCase().includes("email")) {
          emailRef.current?.focus();
        } else if (errorMessage.toLowerCase().includes("password")) {
          passwordRef.current?.focus();
        }
      }
    } catch (error) {
      // Enhanced error logging
      console.error(`${userRole} login error:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });

      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage, { autoClose: 5000 });

      // Handle specific error cases
      if (error.response?.status === 401) {
        // Invalid credentials - focus password field
        passwordRef.current?.focus();
        passwordRef.current?.select();
      } else if (error.response?.status === 422) {
        // Invalid input - focus email field
        emailRef.current?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e) => {
      // Ctrl/Cmd + Enter to submit
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "Enter" &&
        validation.form.canSubmit
      ) {
        onSubmitHandler(e);
      }
      // Escape to clear form
      if (e.key === "Escape") {
        setFormData({ email: "", password: "" });
        emailRef.current?.focus();
      }
    },
    [validation.form.canSubmit, onSubmitHandler]
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <form
        ref={formRef}
        onSubmit={onSubmitHandler}
        onKeyDown={handleKeyDown}
        className="flex flex-col gap-5 items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg bg-white transition-all duration-200 hover:shadow-xl"
        noValidate
        aria-labelledby="login-heading">
        <img
          src={happyodent_logo}
          alt="HappyOdent Logo"
          className="w-full h-12 object-contain mb-4"
        />
        <h1 id="login-heading" className="text-2xl font-semibold mx-auto mb-2">
          <span className="text-[#eac319]">{userRole}</span> Login
        </h1>

        {/* Rate limiting warning */}
        {isRateLimited && (
          <div className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              Too many attempts. Please wait a moment before trying again.
            </p>
          </div>
        )}

        {/* Email field */}
        <div className="w-full">
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email Address *
          </label>
          <input
            ref={emailRef}
            id="email"
            className={`border rounded-md w-full p-3 transition-all duration-200 ${
              formData.email && !validation.email.valid
                ? "border-red-300 focus:border-red-500 bg-red-50"
                : "border-[#DADADA] focus:border-primary"
            } focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-20 disabled:bg-gray-50 disabled:cursor-not-allowed`}
            type="email"
            required
            disabled={isLoading || isRateLimited}
            onChange={handleInputChange("email")}
            value={formData.email}
            placeholder="Enter your email"
            autoComplete="email"
            aria-describedby={
              !validation.email.valid ? "email-error" : "email-help"
            }
            aria-invalid={formData.email && !validation.email.valid}
          />
          {formData.email && !validation.email.valid && (
            <p
              id="email-error"
              className="text-red-500 text-xs mt-1"
              role="alert">
              {validation.email.message}
            </p>
          )}
          {!formData.email && (
            <p id="email-help" className="text-gray-500 text-xs mt-1">
              Enter your registered email address
            </p>
          )}
        </div>

        {/* Password field */}
        <div className="w-full">
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password *
          </label>
          <div className="relative">
            <input
              ref={passwordRef}
              id="password"
              className={`border rounded-md w-full p-3 pr-12 transition-all duration-200 ${
                formData.password && !validation.password.valid
                  ? "border-red-300 focus:border-red-500 bg-red-50"
                  : "border-[#DADADA] focus:border-primary"
              } focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-20 disabled:bg-gray-50 disabled:cursor-not-allowed`}
              type={showPassword ? "text" : "password"}
              required
              disabled={isLoading || isRateLimited}
              onChange={handleInputChange("password")}
              value={formData.password}
              placeholder="Enter your password"
              autoComplete="current-password"
              minLength={VALIDATION.MIN_PASSWORD_LENGTH}
              aria-describedby={
                !validation.password.valid ? "password-error" : "password-help"
              }
              aria-invalid={formData.password && !validation.password.valid}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              disabled={isLoading || isRateLimited}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 disabled:opacity-50"
              aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
          {formData.password && !validation.password.valid && (
            <p
              id="password-error"
              className="text-red-500 text-xs mt-1"
              role="alert">
              {validation.password.message}
            </p>
          )}
          {!formData.password && (
            <p id="password-help" className="text-gray-500 text-xs mt-1">
              Minimum {VALIDATION.MIN_PASSWORD_LENGTH} characters required
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!validation.form.canSubmit}
          className={`w-full py-3 px-4 rounded-md text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            validation.form.canSubmit
              ? "bg-primary text-white hover:bg-primary/90 focus:ring-primary shadow-sm hover:shadow-md active:transform active:scale-[0.98]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          aria-describedby="submit-button-status">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            `Sign in as ${userRole}`
          )}
        </button>

        <p id="submit-button-status" className="sr-only">
          {!validation.form.valid
            ? "Please fill in all required fields correctly to enable login"
            : "Form is ready for submission"}
        </p>

        {/* Role switch */}
        <div className="w-full text-center pt-2 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Need to sign in as{" "}
            <strong>
              {userRole === USER_ROLES.ADMIN ? "Doctor" : "Admin"}
            </strong>
            ?{" "}
            <button
              type="button"
              onClick={handleRoleToggle}
              disabled={isLoading}
              className="text-primary font-medium underline cursor-pointer hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded px-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label={`Switch to ${
                userRole === USER_ROLES.ADMIN ? "Doctor" : "Admin"
              } login`}>
              Switch here
            </button>
          </p>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="w-full text-xs text-gray-400 text-center">
          <p>Tip: Press Ctrl+Enter to submit • Press Escape to clear form</p>
        </div>
      </form>
    </div>
  );
};

export default Login;
