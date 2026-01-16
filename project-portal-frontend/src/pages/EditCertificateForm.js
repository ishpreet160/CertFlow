import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

function EditCertificateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    title: '', client: '', technologies: '', project_status: '', value: '', file: null
  });

  // FIXED: Added missing state definitions
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/certificates/${id}`)
      .then((res) => setForm({ ...res.data, file: null }))
      .catch(() => setError('Failed to load certificate data.'));
  }, [id]);

  // FIXED: Added missing handleChange function
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setForm({ ...form, file: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null) data.append(key, value);
    });

    try {
      await api.patch(`/certificates/${id}`, data);
      setMessage('✅ Changes saved and resent for approval.');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError('❌ Update failed. Check your connection.');
    }
  };

  return (
    <div className="container mt-5 p-4 shadow rounded bg-white" style={{ maxWidth: '600px' }}>
      <h2 className="text-center text-primary mb-4">Edit & Resend Certificate</h2>
      {error && <div className="alert alert-danger text-center small">{error}</div>}
      {message && <div className="alert alert-success text-center small">{message}</div>}

      <form onSubmit={handleSubmit}>
        {['title', 'client', 'technologies', 'project_status', 'value'].map((field, i) => (
          <div className="form-group mb-3" key={i}>
            <label className="fw-semibold text-capitalize">{field.replace('_', ' ')}</label>
            <input
              type="text"
              name={field}
              value={form[field] || ''}
              className="form-control"
              onChange={handleChange}
              required
            />
          </div>
        ))}
        <div className="form-group mb-3">
          <label className="fw-semibold">Upload New File (Optional)</label>
          <input type="file" name="file" className="form-control" onChange={handleChange} accept=".pdf" />
        </div>
        <div className="text-center">
          <button type="submit" className="btn btn-primary px-5 fw-bold">RESEND FOR APPROVAL</button>
        </div>
      </form>
    </div>
  );
}

export default EditCertificateForm;