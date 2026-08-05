import axios from "axios";
import { getToken, removeToken } from "../auth/token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
    "X-Client": "RAKSHAK-BSIP/2.4",
  },
});

// Attach JWT automatically to every request
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Handle API errors and expired/invalid sessions
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.warn("[RAKSHAK API]", err.config?.url, err.message);

    if (err.response?.status === 401) {
      const token = getToken();

      // Only treat 401 as an expired/invalid session
      // when the user actually had a token.
      if (token) {
        removeToken();

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(err);
  },
);

export default api;
