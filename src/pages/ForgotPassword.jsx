import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../api/axios"; // your axios instance
import "../style/register.css";
import { useNavigate } from "react-router-dom";
export default function ForgotPasswordDesign() {
  const [step, setStep] = useState(1); // 1 = email, 2 = code + new password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
  // Step 1: Send reset code
  const handleSendCode = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await api.post("/forgot-password", { email });
      toast.success("Check your email for the reset code");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code & reset password
  const handleResetPassword = async () => {
    if (!code || !password || !passwordConfirm) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/reset-password", {
        email,
        code,
        password,
        password_confirmation: passwordConfirm,
      });
      toast.success("Password reset successful ✅");
      setStep(1);
      setEmail("");
      setCode("");
      setPassword("");
      setPasswordConfirm("");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="auth-card">
        <a href="/login" className="back-link">← Back to Login</a>

        {step === 1 && (
          <>
            <h2 className="title">Forgot Password?</h2>
            <p className="description">
              Enter your email address to receive a 6-digit reset code.
            </p>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              className="primary-btn"
              onClick={handleSendCode}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="title">Reset Password</h2>
            <p className="description">
              Enter the code you received via email and set your new password.
            </p>

            <div className="form-group">
              <label>Reset Code</label>
              <input
                type="text"
                placeholder="6-digit code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

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
              onClick={handleResetPassword}
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}