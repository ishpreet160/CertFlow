import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function RegisterPage() {
  const navigate = useNavigate();
  const currentUserRole = localStorage.getItem('userRole');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee', 
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // If a regular employee somehow lands here, boot them out.
  useEffect(() => {
    if (currentUserRole === 'employee') {
      navigate('/dashboard');
    }
  }, [currentUserRole, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      // The backend auth.py handles the hierarchy verification
      const res = await api.post('/auth/register', form);
      setMessage(`✅ Success: ${res.data.message}`);
      
      // Don't navigate away immediately so the admin can see the success
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 p-4 bg-white rounded shadow-sm" style={{ maxWidth: '500px' }}>
      <h2 className="text-center mb-4 text-dark fw-bold">Register New User</h2>
      <p className="text-muted text-center">Creating user as: <strong>{currentUserRole}</strong></p>

      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            name="name"
            className="form-control"
            placeholder="John Doe"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            name="email"
            className="form-control"
            placeholder="name@tcil.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Temporary Password</label>
          <input
            type="password"
            name="password"
            className="form-control"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-4">
          <label className="form-label">Designated Role</label>
          <select
            name="role"
            className="form-select"
            value={form.role}
            onChange={handleChange}
          >
            <option value="employee">Employee</option>
      
            {currentUserRole === 'admin' && (
              <option value="manager">Manager</option>
            )}
          </select>
          <div className="form-text">
            {currentUserRole === 'manager' 
              ? "Managers can only register Employees." 
              : "Admins can register Managers and Employees."}
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary w-100 fw-bold" 
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Register User'}
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;