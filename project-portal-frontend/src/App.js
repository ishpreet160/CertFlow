import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import NavBar from './NavBar';
import ProtectedRoute from './ProtectedRoute';
import HomePage from "./pages/HomePage";
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import CertificateDetails from './pages/CertificateDetails';
import RegisterPage from './pages/RegisterPage';
import ManagerTCILCertificates from './pages/ManagerTCILCertificates';
import EditCertificateForm from './pages/EditCertificateForm';
import TCILUploadForm from './pages/TCILUploadForm';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
  return (
    <div>
      <NavBar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/upload"
          element={<ProtectedRoute><UploadPage /></ProtectedRoute>}
        />
        <Route
          path="/certificate/:id"
          element={<ProtectedRoute><CertificateDetails /></ProtectedRoute>}
        />
        <Route
          path="/certificates/edit/:id"
          element={<ProtectedRoute><EditCertificateForm /></ProtectedRoute>}
        />
        <Route
          path="/tcil-upload"
          element={<ProtectedRoute><TCILUploadForm /></ProtectedRoute>}
        />
        <Route
          path="/manager/tcil-certificates"
          element={<ProtectedRoute><ManagerTCILCertificates /></ProtectedRoute>}
        />

        {/* Catch-all fallback route */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
