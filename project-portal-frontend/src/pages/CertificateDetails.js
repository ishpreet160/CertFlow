import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

function CertificateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Get role from storage
  const role = localStorage.getItem('userRole');
  
  const [cert, setCert] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        setLoading(true);
        // Interceptor handles the 'Authorization' header automatically now.
        const res = await api.get(`/certificates/${id}`);
        setCert(res.data);
      } catch (err) {
        console.error(err);
        setMsg('❌ Certificate not found or unauthorized access.');
      } finally {
        setLoading(false);
      }
    };

    fetchCert();
  }, [id]);

  const handleUpdate = async (newStatus) => {
    try {
      await api.patch(`/certificates/${id}/status`, { status: newStatus });
      alert(`Successfully marked as ${newStatus}`);
      navigate('/dashboard');
    } catch (err) {
      alert('❌ Failed to update status. Check permissions.');
    }
  };

  const handlePreview = async () => {
    try {
      const response = await api.get(`/certificates/${id}/file`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      window.open(url, '_blank');
    } catch (err) {
      alert('Cannot preview file.');
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/certificates/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${cert.title || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Download failed.");
    }
  };

  if (msg) return <div className="container mt-5 alert alert-danger text-center">{msg}</div>;
  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container mt-5 p-4 bg-white rounded shadow-sm" style={{ maxWidth: '800px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary fw-bold mb-0">Certificate Information</h2>
        <span className={`badge rounded-pill p-2 px-3 text-capitalize ${
          cert.status === 'approved' ? 'bg-success' :
          cert.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'
        }`}>
          {cert.status}
        </span>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="text-muted small text-uppercase fw-bold">Project Title</label>
          <p className="fs-5 fw-semibold">{cert.title}</p>
        </div>
        <div className="col-md-6">
          <label className="text-muted small text-uppercase fw-bold">Client</label>
          <p className="fs-5">{cert.client}</p>
        </div>
        <div className="col-12">
          <label className="text-muted small text-uppercase fw-bold">Technologies</label>
          <p className="border-start ps-3 py-1 bg-light">{cert.technologies || 'No technologies listed'}</p>
        </div>
        <div className="col-md-4">
          <label className="text-muted small text-uppercase fw-bold">Start Date</label>
          <p>{cert.start_date ? new Date(cert.start_date).toLocaleDateString() : '—'}</p>
        </div>
        <div className="col-md-4">
          <label className="text-muted small text-uppercase fw-bold">End Date</label>
          <p>{cert.end_date ? new Date(cert.end_date).toLocaleDateString() : '—'}</p>
        </div>
        <div className="col-md-4">
          <label className="text-muted small text-uppercase fw-bold">Value</label>
          <p>{cert.value || '—'}</p>
        </div>
      </div>

      <hr />

      <div className="d-flex flex-wrap gap-2 mt-4">
        <button className="btn btn-dark" onClick={handlePreview}>👁️ Preview File</button>
        <button className="btn btn-outline-dark" onClick={handleDownload}>📥 Download PDF</button>

        {role === 'manager' && cert.status === 'pending' && (
          <>
            <button className="btn btn-success ms-auto" onClick={() => handleUpdate('approved')}>Approve</button>
            <button className="btn btn-danger" onClick={() => handleUpdate('rejected')}>Reject</button>
          </>
        )}
      </div>

      <div className="mt-5 border-top pt-3 d-flex justify-content-between">
        <button className="btn btn-link text-decoration-none p-0" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <small className="text-muted">Uploaded: {new Date(cert.created_at).toLocaleString()}</small>
      </div>
    </div>
  );
}

export default CertificateDetails;