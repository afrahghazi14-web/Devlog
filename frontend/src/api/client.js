import axios from "axios";

// Base URL loaded from environment variables (defaults to local backend API v1)
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Response interceptor converts backend API error envelopes into a plain Error
// with the backend's error.message (or a friendly network error message).
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Check if the backend returned a standardized JSON error response
    if (error.response?.data?.error?.message) {
      const appError = new Error(error.response.data.error.message);
      appError.code = error.response.data.error.code;
      appError.status = error.response.status;
      appError.details = error.response.data.error.details;
      return Promise.reject(appError);
    }

    // Server was unreachable or connection was dropped
    if (error.request) {
      const netError = new Error(
        "Unable to reach the DevLog backend server. Please verify your connection."
      );
      netError.code = "NETWORK_ERROR";
      return Promise.reject(netError);
    }

    // Fallback error
    return Promise.reject(
      new Error(error.message || "An unexpected error occurred.")
    );
  }
);

export default apiClient;
