import api from "./axios";
import { toast } from "react-toastify";

export const loginUser = async (data) => {
  try {
    const response = await api.post("/login", data);
    toast.success("Login successful ✅");

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Login failed ❌";

    toast.error(message);

    throw error.response?.data || { message };
  }
};

export const registerUser = async (data) => {
  try {
    const response = await api.post("/register", data);
    toast.success("Registration successful 🎉");

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Registration failed ❌";

    toast.error(message);

    throw error.response?.data || { message };
  }
};

export const verifyAccount = async (data) => {
  try {
    const response = await api.post("/verify", data); // ← match Laravel
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Network error. Please try again." };
  }
};

export const sendResetLink = async (data) => {
  try {
    const response = await api.post("/forgot-password", data); // ← match Laravel
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Network error. Please try again." };
  }
};