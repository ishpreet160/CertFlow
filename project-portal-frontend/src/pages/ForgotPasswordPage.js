import React, { useState } from 'react';
import api from '../api/axios';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => { 
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await api.post('/auth/forgot-password', { email });

      setMessage(res.data.message || '✅ Check your email for the reset link.');
    } catch (err) {
      setMessage(err.response?.data?.message || '❌ Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container d-flex align-items-center justify-content-center"
      style={{ minHeight: "80vh" }}
    >
      <div
        className="card shadow-lg p-4 border-0"
        style={{ maxWidth: "400px", width: "100%", borderRadius: "15px" }}
      >
        <h3 className="text-center fw-bold mb-3 text-primary">
          Reset Password
        </h3>
        <p className="text-muted small text-center mb-4">
          Enter your registered email to receive a secure recovery link.
        </p>

        {message && (
          <div
            className={`alert ${message.includes("✅") ? "alert-success" : "alert-danger"} small text-center`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleReset}>
          <div className="mb-3">
            <label htmlFor="reset-email" className="form-label small fw-bold">
              Email Address
            </label>
            <input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              className="form-control"
              placeholder="name@tcil.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
            disabled={loading}
          >
            {loading ? "SENDING..." : "SEND RESET LINK"}
          </button>
        </form>

        <div className="text-center mt-4">
          <a href="/login" className="text-decoration-none small fw-bold">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;