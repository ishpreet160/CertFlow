import React from "react";
import { Link, useNavigate } from "react-router-dom";

function NavBar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
      <Link className="navbar-brand fw-bold fs-4" to="/dashboard">
        TCIL Portal
      </Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon" />
      </button>

      <div className="collapse navbar-collapse" id="navbarNav">
        {token && (
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link className="nav-link" to="/dashboard">
                Dashboard
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/upload">
                Upload Project Experience
              </Link>
            </li>

            {/* TCIL Certificate for Manager only */}
            {role === "manager" && (
              <li className="nav-item">
                <Link className="nav-link" to="/tcil-upload">
                  Upload TCIL Certificates
                </Link>
              </li>
            )}
             {role === 'manager' && (
             <li className="nav-item">
              <Link to="/manager/tcil-certificates" className="nav-link">
                 View TCIL Certificates
              </Link>
             </li>
            )}

            <li className="nav-item">
              <button className="btn btn-outline-danger ms-3" onClick={handleLogout}>
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
