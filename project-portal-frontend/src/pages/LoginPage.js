import React, { useState } from "react";
import api from '../api/axios';
import { useNavigate, Link } from "react-router-dom";
import "../styles/login.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(""); // Clear old messages

    try {
      // Logic: Send email and password to the dynamic backend URL
      // We don't need {withCredentials: true} here because it's already in axios.js
      const response = await api.post("/auth/login", {
        email: email,
        password: password,
      });

      const token = response.data.access_token;
      localStorage.setItem("token", token);

      // Decoding the JWT to get user roles
      const decoded = JSON.parse(atob(token.split(".")[1]));
      localStorage.setItem("role", decoded.sub.role || decoded.identity.role);

      setMessage("Login successful!");
      
      // Artificial delay to show success message before navigating
      setTimeout(() => navigate("/dashboard"), 1000);
      
    } catch (error) {
      console.error("Login Error:", error);
      // Capture specific error messages from your Flask backend
      const errorMsg = error.response?.data?.msg || error.response?.data?.message || "Invalid email or password";
      setMessage(errorMsg);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="text-center mb-3 fw-bold">Welcome Back</h2>

        {message && <div className="alert alert-info py-1">{message}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control input-small"
              id="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-2">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control input-small"
                id="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="text-end mb-3">
            <Link to="/forgot-password" id="forgot-link">
              Forgot Password?
            </Link>
          </div>

          <div className="text-center">
            <button type="submit" className="btn btn-primary btn-sm w-50">
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;