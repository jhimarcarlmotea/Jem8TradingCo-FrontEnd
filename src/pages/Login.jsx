import React, { useState } from "react";
import "../style/login.css";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await loginUser({
        email: emailOrPhone,
        password: password,
      });

      console.log("Login success:", data);

      // Save token if using JWT
      // if (data.token) {
      //   localStorage.setItem("token", data.token);
      // }

      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="login-card">
        <h2 className="title">Log in</h2>

        {/* {error && <p className="error-text">{error}</p>} */}

        <div className="form-group">
          <label>Email address or Phone number</label>
          <div className="input-wrapper">
            <input
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Password</label>
          <div className="input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁"}
            </span>
          </div>
        </div>

        <div className="options">
          <a
            onClick={() => navigate("/forgot-password")}
            className="forgot"
          >
            Forgot password?
          </a>

          <label className="remember">
            <input type="checkbox" />
            Remember Me
          </label>
        </div>

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        <p className="register-text">
          Don't have account? <a href="/register">Register Now</a>
        </p>

        <div className="divider">Or Login with</div>

        <button className="google-btn">
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="google"
          />
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Login;