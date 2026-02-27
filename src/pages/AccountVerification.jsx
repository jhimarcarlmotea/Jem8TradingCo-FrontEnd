import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyAccount } from "../api/auth"; // API call
import '../style/register.css';
export default function AccountVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const response = await verifyAccount({ email, code });
      console.log("Verification success:", response);

      navigate("/login"); // redirect after success
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="auth-card">
        <a href="/login" className="back-link">← Back to Login</a>

        <h2 className="title">Account Verification</h2>

        <div className="form-group">
          <label>Verification Code</label>
          <input
            type="text"
            placeholder="Enter the 6-digit code"
            maxLength="6"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <button className="primary-btn" onClick={handleVerify} disabled={loading}>
          {loading ? "Verifying..." : "Verify Account"}
        </button>
      </div>
    </div>
  );
}