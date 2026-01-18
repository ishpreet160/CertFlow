import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

function ManagerDashboard() {
  const [certs, setCerts] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [certsRes, statsRes] = await Promise.all([
        api.get('/certificates/all'),
        api.get('/dashboard/stats')
      ]);
      setCerts(certsRes.data);
      setStats({
        total: statsRes.data.total_uploads,
        pending: statsRes.data.pending_approvals
      });
    } catch (err) {
      console.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = { pending: 'bg-warning', approved: 'bg-success', rejected: 'bg-danger' };
    return <span className={`badge ${colors[status] || 'bg-secondary'} text-uppercase`}>{status}</span>;
  };

  if (loading) return <div className="text-center mt-5"><h4>Loading Team Repository...</h4></div>;

  return (
    <div className="container mt-4">
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card bg-primary text-white shadow-sm">
            <div className="card-body">
              <h5>Total Team Uploads</h5>
              <h2 className="fw-bold">{stats.total}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card bg-warning text-dark shadow-sm">
            <div className="card-body">
              <h5>Pending Approvals</h5>
              <h2 className="fw-bold">{stats.pending}</h2>
            </div>
          </div>
        </div>
      </div>

      <h3 className="border-bottom pb-2 mb-4">Team Certificates</h3>
      <div className="row">
        {certs.map(cert => (
          <div className="col-md-4 mb-4" key={cert.id}>
            <div className="card h-100 shadow-sm border-0">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <strong>ID: {cert.id}</strong>
                {getStatusBadge(cert.status)}
              </div>
              <div className="card-body">
                <h5 className="card-title text-truncate">{cert.title}</h5>
                <p className="card-text text-muted mb-1 small"><strong>Client:</strong> {cert.client}</p>
                <p className="card-text text-muted mb-1 small"><strong>Uploaded:</strong> {new Date(cert.timestamp).toLocaleDateString()}</p>
              </div>
              <div className="card-footer bg-light border-0 d-grid gap-2">
                <Link to={`/certificates/${cert.id}`} className="btn btn-outline-primary btn-sm">View Full Details</Link>
                {cert.status === 'pending' && (
                  <Link to={`/certificates/${cert.id}/status`} className="btn btn-success btn-sm">Review & Approve</Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManagerDashboard;