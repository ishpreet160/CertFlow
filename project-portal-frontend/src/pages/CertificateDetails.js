import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
//import DownloadButton from '../components/DownloadButton';//

function CertificateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [role, setRole] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const token = localStorage.getItem('token');

        // 1. Fetch profile to get user role
        const profileRes = await api.get('/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRole(profileRes.data.role);

        // 2. Fetch certificate details with token
        const res = await api.get(`/certificates/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCert(res.data);
      } catch (err) {
        console.error(err);
        setMsg('Certificate not found or unauthorized.');
      }
    };

    fetchCert();
  }, [id]);

  const handleUpdate = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(`/certificates/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(`Marked as ${newStatus}`);
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to update status');
      console.error(err);
    }
  };

  if (msg) {
    return <p className="text-danger text-center mt-5">{msg}</p>;
  }

  if (!cert) {
    return <p className="text-center mt-5">Loading certificate details…</p>;
  }

  return (
    <div className="container mt-5 p-4 bg-light rounded shadow">
      <h2 className="text-center text-primary mb-4">Certificate Details</h2>

      <div className="mb-4">
        <strong>Project Title:</strong> {cert.title} <br />
        <strong>Client:</strong> {cert.client} <br />
        <strong>Technologies:</strong> {cert.technologies || '—'} <br />
        
        <strong>Status:</strong>{' '}
        <span className={`badge text-capitalize ${
          cert.status === 'approved' ? 'bg-success' :
          cert.status === 'rejected' ? 'bg-danger' :
          'bg-warning '
        }`}>
          {cert.status}
        </span><br />
        <strong>Value:</strong> {cert.value || '—'} <br />
        <strong>Uploaded At:</strong> {new Date(cert.created_at).toLocaleString()}<br/>

        <strong>Start Date:</strong> {cert.start_date ? new Date(cert.start_date).toLocaleDateString() : '—'} <br />
        <strong>End Date:</strong> {cert.end_date ? new Date(cert.end_date).toLocaleDateString() : '—'} <br />
        <strong>Go-Live Date:</strong> {cert.go_live_date ? new Date(cert.go_live_date).toLocaleDateString() : '—'} <br />
        <strong>TCIL Contact:</strong> {cert.tcil_contact || '—'} <br />
      </div>

      {/* {cert.status === 'approved' && (
        <DownloadButton certId={cert.id} />
      )} */}

      {role === 'manager' && cert.status === 'pending' && (
        <div className="mt-3">
          <button
            className="btn btn-outline-success me-3"
            onClick={() => handleUpdate('approved')}
          >
            Approve
          </button>
          <button
            className="btn btn-outline-danger-reject"
            onClick={() => handleUpdate('rejected')}
          >
            Reject
          </button>
        </div>
      )}

      <div className="mt-4">
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default CertificateDetails;
