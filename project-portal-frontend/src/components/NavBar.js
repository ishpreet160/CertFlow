import React from "react";
import { Link, useNavigate } from "react-router-dom";

function NavBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  
  const role = localStorage.getItem("userRole"); 
  const userName = localStorage.getItem("userName");

  const handleLogout = () => {
    localStorage.clear(); // Clear everything to prevent session bleeding
    window.location.href = "/login"; // Force fresh state
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4 shadow-sm">
      <Link className="navbar-brand fw-bold fs-4" to="/dashboard">
        TCIL Portal
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
        {token && (
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link className="nav-link" to="/dashboard">Dashboard</Link>
            </li>

            {/* Standard Project Upload for Employees/Managers */}
            <li className="nav-item">
              <Link className="nav-link" to="/upload">Upload Project Experience</Link>
            </li>

            {/* TCIL Specifics for Manager/Admin only */}
            {(role === "manager" || role === "admin") && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/tcil-upload">Upload TCIL Certs</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Register User</Link>
                </li>
              </>
            )}

            <li className="nav-item ms-lg-3">
              <span className="navbar-text text-light me-3 d-none d-lg-inline">
                Hi, <strong>{userName || 'User'}</strong> 
                <span className="badge bg-primary ms-2 text-uppercase" style={{fontSize: '0.7rem'}}>
                  {role}
                </span>
              </span>
            </li>

            <li className="nav-item">
              <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}

export default NavBar;