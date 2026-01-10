import React from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "90vh" }}>
      <div className="bg-white p-5 rounded shadow" style={{ maxWidth: "600px", width: "100%" }}>
        <h1 className="text-center text-primary fw-bold mb-3">Welcome to the TCIL Portal</h1>
        <p className="text-center text-muted">
          Upload, track, and manage project experience certificates with ease.
        </p>

        <div className="d-flex justify-content-center gap-4 mt-4">
          <button
            className="btn btn-primary px-4 py-2"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button
            className="btn btn-outline-secondary px-4 py-2"
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
