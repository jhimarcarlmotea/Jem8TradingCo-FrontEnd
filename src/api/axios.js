import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
});

// Auto-attach token sa bawat request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // If we're sending FormData, allow the browser to set the Content-Type boundary
  try {
    if (config && config.data && typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) delete config.headers['Content-Type'];
    }
  } catch (e) { /* ignore */ }
  return config;
});

export default api;

// -----------------------------
// Global axios fallback (backup)
// -----------------------------
// Some pages import the default axios instance directly. To avoid 401s when
// those files don't use the `api` instance, attach a global request interceptor
// that fills `Authorization` from localStorage if it's missing.

// Initialize global header from any existing token
const initialToken = localStorage.getItem("token");
if (initialToken) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${initialToken}`;
}

// Global request interceptor as a backup (only set header when absent)
axios.interceptors.request.use((config) => {
  try {
    if (!config.headers) config.headers = {};
    const hasAuth = config.headers.Authorization || config.headers.authorization;
    if (!hasAuth) {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Keep global defaults in sync when token changes (other tabs or flows)
if (typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("storage", (e) => {
    if (e.key === "token") {
      if (e.newValue) axios.defaults.headers.common["Authorization"] = `Bearer ${e.newValue}`;
      else delete axios.defaults.headers.common["Authorization"];
    }
  });
}