import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import NavBar from './components/NavBar';
import ProtectedRoute from './ProtectedRoute';
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
import Home from './pages/Home';

function App() {
  return (
    <div>
      <NavBar />
      <main className="flex-grow-1 d-flex flex-column justify-content-center">
      <Routes>
          <Route
          path="/register"
          element={<RegisterPage/>}/>


        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Public Password Recovery Routes */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        
        {/* Standard Protected Routes */}
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

        {/* Manager-Only Restricted Routes */}
        <Route
          path="/tcil-upload"
          element={<ProtectedRoute><TCILUploadForm /></ProtectedRoute>}
        />
        <Route
          path="/manager/tcil-certificates"
          element={<ProtectedRoute><ManagerTCILCertificates /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      </main>
    </div>
  );
}

export default App;