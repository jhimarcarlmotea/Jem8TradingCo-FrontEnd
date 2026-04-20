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