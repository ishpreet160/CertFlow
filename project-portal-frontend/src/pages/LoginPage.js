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
    setMessage("");

    try {
      // Sending request to the backend
      const response = await api.post("/auth/login", {
        email: email,
        password: password,
      });

      // 1. Destructure the updated response (must match backend's return)
      const { access_token, user } = response.data; 

      // 2. Save session data to localStorage
      localStorage.setItem("token", access_token);
      localStorage.setItem("role", user.role); 

      setMessage("Login successful!");
      
      // 3. Force a refresh to update the NavBar's role-based links
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
      
    } catch (error) {
      console.error("Login Error:", error);
      // Backend error message or default
      const errorMsg = error.response?.data?.message || "Invalid email or password";
      setMessage(errorMsg);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="text-center mb-3 fw-bold">Welcome Back</h2>

        {message && (
          <div className={`alert ${message.includes("successful") ? "alert-success" : "alert-danger"} py-1`}>
            {message}
          </div>
        )}

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
            {/* Challenge: Ensure this route exists in App.js or update 
              to match your backend URL if it's a direct link. 
            */}
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