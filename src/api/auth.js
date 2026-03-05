import api from "./axios";
import axios from "axios";
import { toast } from "react-toastify";

const BASE_URL = "http://127.0.0.1:8000";

// ==============================
// SANCTUM CSRF (Only if needed)
// ==============================
export const ensureCsrf = async () => {
  try {
    await axios.get(`${BASE_URL}/sanctum/csrf-cookie`, {
      withCredentials: true,
    });
  } catch (error) {
    console.warn("CSRF cookie not required.");
  }
};

// ==============================
// GET AUTHENTICATED USER
// ==============================
export const me = async () => {
  try {
    const { data } = await api.get("/me");
    return data;
  } catch (error) {
    return null;
  }
};

// ==============================
// LOGIN
// ==============================
export const loginUser = async (credentials) => {
  try {
    await ensureCsrf(); // needed for Sanctum SPA login

    const { data } = await api.post("/login", credentials);

    toast.success("Login successful ✅");
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Login failed ❌";

    toast.error(message);
    throw error.response?.data || { message };
  }
};

// ==============================
// REGISTER
// ==============================
export const registerUser = async (formData) => {
  try {
    const { data } = await api.post("/register", formData);

    toast.success("Registration successful 🎉");
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Registration failed ❌";

    toast.error(message);
    throw error.response?.data || { message };
  }
};

// ==============================
// VERIFY EMAIL
// ==============================
export const verifyAccount = async (payload) => {
  try {
    const { data } = await api.post("/verify", payload);

    toast.success("Email verified successfully ✅");
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Verification failed ❌";

    toast.error(message);
    throw error.response?.data || { message };
  }
};

// ==============================
// FORGOT PASSWORD
// ==============================
export const sendResetCode = async (payload) => {
  try {
    const { data } = await api.post("/forgot-password", payload);

    toast.success("Reset code sent 📩");
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to send reset code ❌";

    toast.error(message);
    throw error.response?.data || { message };
  }
};

// ==============================
// RESET PASSWORD
// ==============================
export const resetPassword = async (payload) => {
  try {
    const { data } = await api.post("/reset-password", payload);

    toast.success("Password reset successful 🔐");
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Reset failed ❌";

    toast.error(message);
    throw error.response?.data || { message };
  }
};

// ==============================
// LOGOUT
// ==============================
export const logout = async () => {
  try {
    const { data } = await api.post("/logout");

    toast.success("Logged out successfully 👋");
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Logout failed ❌";

    toast.error(message);
    throw error.response?.data || { message };
  }
};

// ==============================
// UPDATE PROFILE
// ==============================
export const updateProfile = async (updatedData) => {
  try {
    const { data } = await api.post("/profile/update", updatedData);

    toast.success("Profile updated successfully ✅");
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Profile update failed ❌";

    toast.error(message);
    throw error.response?.data || { message };
  }
};

// ==============================
// UPDATE PROFILE IMAGE
// ==============================
export const updateProfileImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append("profile_image", file);

    const { data } = await api.post(
      "/profile/update-image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    toast.success("Profile image updated 🖼️");
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Image upload failed ❌";

    toast.error(message);
    throw error.response?.data || { message };
  }
};