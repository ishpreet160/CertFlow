import React, { useState } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';

function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMsg('❌ Passwords do not match');
      return;
    }

    setLoading(true);
    try {
     
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      setMsg(`✅ ${res.data.msg || 'Password updated successfully!'}`);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMsg(err.response?.data?.msg || '❌ Link expired or invalid token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <div className="card shadow-lg p-4 border-0" style={{ maxWidth: "400px", width: "100%", borderRadius: "15px" }}>
        <h3 className="text-center fw-bold mb-3 text-success">New Password</h3>
        <p className="text-muted small text-center mb-4">Please enter and confirm your new secure password.</p>

        {msg && (
          <div className={`alert ${msg.includes('✅') ? 'alert-success' : 'alert-danger'} small text-center`}>
            {msg}
          </div>
        )}

        <form onSubmit={handleReset}>
          <div className="mb-3">
            <label className="form-label small fw-bold">New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-bold">Confirm New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-success btn-lg w-100 fw-bold shadow-sm"
            disabled={loading}
          >
            {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;