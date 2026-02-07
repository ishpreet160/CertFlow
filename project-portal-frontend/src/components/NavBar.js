import React from "react";
import { Link, useNavigate } from "react-router-dom";

function NavBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole"); 
  const userName = localStorage.getItem("userName");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4 shadow-sm">
      <Link className="navbar-brand fw-bold fs-4" to="/dashboard">
        CertFlow
      </Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span className="navbar-toggler-icon" />
      </button>

      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto align-items-center">
          {token ? (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard">Dashboard</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/upload">Upload Experience</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/tcil-upload">Upload TCIL</Link>
              </li>
              <li className="nav-item">
                {/* FIXED: This now matches the updated App.js route */}
                <Link className="nav-link" to="/tcil-repository">
                  View Certifications
                </Link>
              </li>

              <li className="nav-item d-flex align-items-center ms-lg-3 py-2">
                <span className="navbar-text text-light me-3">
                  Hi, <strong className="me-1">{userName || "User"}</strong>
                  <span className="badge bg-primary">{role}</span>
                </span>
                <button
                  className="btn btn-sm btn-danger fw-bold ms-2 shadow-sm"
                  onClick={handleLogout}
                  style={{ borderRadius: "8px" }}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/login">Login</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link btn btn-primary text-white ms-2 px-3" to="/register">
                  Join CertFlow
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default NavBar;