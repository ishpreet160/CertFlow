import React, { useState, useEffect } from "react";
import api from '../api/axios';
import { useNavigate, Link } from "react-router-dom";
import "../styles/login.css";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  //  If the user is already authenticated, don't let them stay here.
  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email,
        password: password,
      });

      const { access_token, user } = response.data; 

      localStorage.setItem("token", access_token);
      localStorage.setItem("userRole", user.role); 
      localStorage.setItem("userName", user.name);

      setMessage("✅ Login successful! Redirecting...");
      
      // 2. The Clean Transition
      // We use window.location.href to ensure the entire App state (including Navbar)
      // re-reads the new localStorage values on load.
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
      
    } catch (error) {
      console.error("Login Error:", error);
      const errorMsg = error.response?.data?.message || "Invalid email or password";
      setMessage(`❌ ${errorMsg}`);
      setLoading(false); 
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card shadow">
        <h2 className="text-center mb-3 fw-bold text-primary">TCIL Portal</h2>
        <p className="text-center text-muted small mb-4">Authorized Access Only</p>

        {message && (
          <div className={`alert ${message.includes("successful") ? "alert-success" : "alert-danger"} py-2 text-center small fw-bold`}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-semibold">Corporate Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="name@tcil.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-2">
            <label htmlFor="password" className="form-label fw-semibold">Password</label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                id="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="text-end mb-4">
            <Link to="/forgot-password" id="forgot-link" className="small text-decoration-none">
              Forgot Password?
            </Link>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 fw-bold py-2 shadow-sm" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                AUTHENTICATING...
              </>
            ) : (
              "SIGN IN"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;