import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import NavBar from "./components/NavBar";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import CertificateDetails from "./pages/CertificateDetails";
import RegisterPage from "./pages/RegisterPage";
import TCILCertificates from "./pages/TCILCertificates";
import EditCertificateForm from "./pages/EditCertificateForm";
import TCILUploadForm from "./pages/TCILUploadForm";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Home from "./pages/Home";

function App() {
  return (
    <div>
      <NavBar />
      <main className="flex-grow-1 d-flex flex-column justify-content-center">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tcil-upload"
            element={
              <ProtectedRoute>
                <TCILUploadForm />
              </ProtectedRoute>
            }
          />
          
          {/* CRITICAL: Ensure this matches the link in Dashboard.js */}
          <Route
            path="/certificate/:id"
            element={
              <ProtectedRoute>
                <CertificateDetails />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/certificates/edit/:id"
            element={
              <ProtectedRoute>
                <EditCertificateForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tcil-repository"
            element={
              <ProtectedRoute>
                <TCILCertificates />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;