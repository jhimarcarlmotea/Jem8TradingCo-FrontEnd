import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import Logo from "../assets/Logo — Jem 8 Circle Trading Co (1).png";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!emailOrPhone || !password) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await loginUser({
        email: emailOrPhone,
        password: password,
      });
      console.log("Login success:", data);
      navigate("/");
    } catch (err) {
      console.log("Login error:", err);
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-[16px]"
      style={{
        paddingTop: "calc(var(--header-h) + 32px)",
        paddingBottom: "48px",
        background: "linear-gradient(135deg, #f9fdf9 0%, #fff 50%, #edf4f0 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-160px", right: "-160px",
          width: "520px", height: "520px",
          background: "radial-gradient(circle, rgba(77,123,101,0.10) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-120px", left: "-120px",
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(77,123,101,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Card */}
      <div
        className="relative z-[1] w-full bg-white rounded-[20px] border border-[#e2e8f0] shadow-[0_16px_48px_rgba(0,0,0,0.09)] overflow-hidden"
        style={{ maxWidth: "400px" }}
      >
        {/* Logo block */}
        <div className="flex flex-col items-center pt-[32px] pb-[20px] px-[32px] border-b border-[#f1f5f9]">
          <img
            src={Logo}
            alt="JEM 8 Circle Trading Co."
            className="h-[56px] w-auto object-contain mb-[12px]"
            onError={(e) => {
              e.target.style.display = "none";
              document.getElementById("login-logo-fallback").style.display = "flex";
            }}
          />
          <div
            id="login-logo-fallback"
            className="w-[56px] h-[56px] rounded-full bg-[#edf4f0] border-2 border-[#b8d9c8] items-center justify-center text-[#4d7b65] font-bold text-[18px] mb-[12px]"
            style={{ display: "none", fontFamily: "var(--font-heading)" }}
          >
            J8
          </div>
          <h1
            className="text-[20px] font-bold text-[#1e293b] mb-[3px] text-center"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Welcome back
          </h1>
          <p className="text-[13px] text-[#64748b] text-center">
            Sign in to your JEM 8 account
          </p>
        </div>

        {/* Form block */}
        <div className="px-[32px] pt-[22px] pb-[0]">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-[8px] bg-red-50 border border-red-200 text-red-600 text-[12.5px] rounded-[8px] px-[12px] py-[9px] mb-[14px]">
              <span className="flex-shrink-0">⚠️</span>
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
            className="flex flex-col gap-[13px]"
          >
            {/* Email */}
            <div className="flex flex-col gap-[5px]">
              <label className="text-[12.5px] font-semibold text-[#374151]">
                Email address or Phone number
              </label>
              <div className="relative">
                <span className="absolute left-[11px] top-1/2 -translate-y-1/2 text-[13px] pointer-events-none">
                  ✉️
                </span>
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-[36px] pr-[12px] py-[10px] bg-[#f8fafb] border-[1.5px] border-[#e2e8f0] rounded-[9px] text-[13.5px] text-[#1e293b] outline-none transition-all duration-200 placeholder:text-[#94a3b8] focus:border-[#4d7b65] focus:bg-white focus:shadow-[0_0_0_3px_rgba(77,123,101,0.12)]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-[5px]">
              <label className="text-[12.5px] font-semibold text-[#374151]">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-[11px] top-1/2 -translate-y-1/2 text-[13px] pointer-events-none">
                  🔒
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-[36px] pr-[40px] py-[10px] bg-[#f8fafb] border-[1.5px] border-[#e2e8f0] rounded-[9px] text-[13.5px] text-[#1e293b] outline-none transition-all duration-200 placeholder:text-[#94a3b8] focus:border-[#4d7b65] focus:bg-white focus:shadow-[0_0_0_3px_rgba(77,123,101,0.12)]"
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[11px] top-1/2 -translate-y-1/2 cursor-pointer text-[15px] select-none text-[#94a3b8] hover:text-[#4d7b65] transition-colors duration-150"
                >
                  {showPassword ? "🙈" : "👁"}
                </span>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-[6px] cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-[14px] h-[14px] accent-[#4d7b65] cursor-pointer"
                />
                <span className="text-[12px] text-[#64748b]">Remember me</span>
              </label>
              <span
                onClick={() => navigate("/forgot-password")}
                className="text-[12px] font-semibold text-[#4d7b65] cursor-pointer hover:text-[#3a5e4e] hover:underline transition-colors duration-150"
              >
                Forgot password?
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-[11px] bg-[#4d7b65] text-white rounded-[9px] font-bold text-[14px] border-none shadow-[0_4px_14px_rgba(77,123,101,0.35)] transition-all duration-200 hover:bg-[#3a5e4e] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(77,123,101,0.4)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-[8px]">
                  <svg className="animate-spin w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Logging in...
                </span>
              ) : "Log in"}
            </button>
          </form>
        </div>

        {/* Bottom links */}
        <div className="px-[32px] pt-[16px] pb-[22px]">
          <p className="text-center text-[12.5px] text-[#64748b] mb-[14px]">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="font-bold text-[#4d7b65] cursor-pointer hover:text-[#3a5e4e] hover:underline transition-colors duration-150"
            >
              Register Now
            </span>
          </p>

          <div className="flex items-center gap-[10px] mb-[14px]">
            <div className="flex-1 h-[1px] bg-[#e2e8f0]" />
            <span className="text-[11.5px] text-[#94a3b8] whitespace-nowrap">Or continue with</span>
            <div className="flex-1 h-[1px] bg-[#e2e8f0]" />
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-[9px] py-[10px] px-[16px] bg-white border-[1.5px] border-[#e2e8f0] rounded-[9px] text-[13.5px] font-semibold text-[#374151] transition-all duration-200 hover:border-[#b8d9c8] hover:bg-[#f9fdf9] hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:-translate-y-[1px] cursor-pointer"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="google"
              className="w-[17px] h-[17px]"
            />
            Continue with Google
          </button>
        </div>

        {/* Brand footer */}
        <div className="px-[32px] py-[12px] bg-[#f8fafb] border-t border-[#e2e8f0] text-center">
          <p className="text-[11px] text-[#94a3b8]">
            © 2024{" "}
            <span className="font-semibold text-[#4d7b65]">JEM 8 Circle Trading Co.</span>
            {" "}· All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;