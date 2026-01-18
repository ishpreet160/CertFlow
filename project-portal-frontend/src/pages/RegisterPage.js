import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

function RegisterPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const currentUserRole = localStorage.getItem('userRole');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    manager_id: '' // Crucial for CertFlow Hierarchy
  });

  const [managers, setManagers] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Fetch available managers on load so the user can link their account
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await api.get('/auth/managers');
        setManagers(res.data);
      } catch (err) {
        console.error("Failed to load managers hierarchy", err);
      }
    };
    fetchManagers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    // Logic Guard: Every employee needs a manager in CertFlow
    if (form.role === 'employee' && !form.manager_id) {
        setMessage('❌ Error: You must select a manager to join the organization.');
        return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      setMessage(`✅ Success: ${res.data.msg || "Account Created!"}`);
      
      // If a guest registered, send them to login. If admin, stay to add more.
      setTimeout(() => {
        if (!token) navigate('/login');
        else setMessage('');
      }, 2000);
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.message || 'Registration failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-body p-5">
              <h2 className="text-center fw-bold mb-2">Join CertFlow</h2>
              <p className="text-muted text-center mb-4">
                Establish your professional identity
              </p>

              {message && (
                <div
                  className={`alert ${
                    message.includes("✅") ? "alert-success" : "alert-danger"
                  } fade show`}
                >
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control form-control"
                    placeholder="e.g. Ishpreet Kaur"
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="form-control form-control"
                    placeholder="name@company.com"
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control form-control"
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* HIERARCHY SELECTION */}
                <div className="mb-4">
                  <label className="form-label fw-semibold ">
                    Assign Manager / Supervisor
                  </label>
                  <select
                    name="manager_id"
                    className="form-select form-select border-primary"
                    onChange={handleChange}
                    required={form.role === "employee"}
                  >
                    <option value="">-- Select Who You Report To --</option>
                    {managers.length > 0 ? (
                      managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role})
                        </option>
                      ))
                    ) : (
                      <option disabled>
                        ⚠️ No supervisors found. Please contact Admin.
                      </option>
                    )}
                  </select>
                  <div className="form-text">
                    This ensures your projects are routed to the right person
                    for approval.
                  </div>
                </div>

                {/* ROLE SELECTION (Only visible if Admin is registering someone) */}
                {currentUserRole === "admin" && (
                  <div className="mb-4 p-3 bg-light rounded">
                    <label className="form-label fw-bold text-danger">
                      Admin Control: Set Role
                    </label>
                    <select
                      name="role"
                      className="form-select"
                      value={form.role}
                      onChange={handleChange}
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Create Account"}
                </button>
              </form>

              {!token && (
                <div className="text-center mt-4">
                  <p className="mb-0 text-muted">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="text-primary fw-bold text-decoration-none"
                    >
                      Login
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;