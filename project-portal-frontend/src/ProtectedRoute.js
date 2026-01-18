import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" />;
  }
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" />; 
  }

  return children;
}

export default ProtectedRoute;