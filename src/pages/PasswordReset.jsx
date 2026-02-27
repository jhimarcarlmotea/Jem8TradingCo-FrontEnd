import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios"; // your axios instance
import "../style/register.css";

export default function PasswordReset() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  // Extract query parameters from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setToken(params.get("token") || "");
    setEmail(params.get("email") || "");
  }, [location.search]);

  const handleReset = async () => {
    if (!password || !passwordConfirm) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== passwordConfirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/reset-password", {
        email,
        token,
        password,
        password_confirmation: passwordConfirm,
      });

      toast.success(response.message || "Password reset successful ✅");
      navigate("/login");
    } catch (err) {
      console.log(err);
      const message = err.response?.data?.message || "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="auth-card">
        <a href="/login" className="back-link">← Back to Login</a>

        <h2 className="title">Reset Password</h2>
        <p className="description">
          Enter your new password below to reset your account password.
        </p>

        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Confirm new password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
        </div>

        <button
          className="primary-btn"
          onClick={handleReset}
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </div>
  );
}