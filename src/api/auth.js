import api from "./axios";
import { toast } from "react-toastify";

// ==============================
// SANCTUM CSRF (Only if needed)
// ==============================


// ==============================
// GET AUTHENTICATED USER
// ==============================
export const me = async () => {
  try {
    const data  = await api.get("/me");
    return data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ==============================
// LOGIN
// ==============================
export const loginUser = async (credentials) => {
  try {
    const { data } = await api.post("/login", credentials);

    // I-save ang token
    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    toast.success("Login successful ✅");
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Login failed ❌";
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