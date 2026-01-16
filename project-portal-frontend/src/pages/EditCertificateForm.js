import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

function EditCertificateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', client: '', technologies: '', project_status: '', value: '', file: null
  });

  useEffect(() => {
    api.get(`/certificates/${id}`)
      .then((res) => setForm({ ...res.data, file: null }))
      .catch(() => alert('Failed to load certificate data.'));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null) data.append(key, value);
    });

    try {
      await api.patch(`/certificates/${id}`, data);
      alert('Changes saved and resent for approval.');
      navigate('/dashboard');
    } catch (err) {
      alert('Update failed.');
    }
  };

  return (
    <div className="container mt-5 p-4 shadow rounded bg-white" style={{ maxWidth: '600px' }}>
      <h2 className="text-center text-primary mb-4">Edit & Resend Certificate</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <form onSubmit={handleSubmit}>
        {['title', 'client', 'technologies', 'project_status', 'value'].map((field, i) => (
          <div className="form-group mb-3" key={i}>
            <label className="fw-semibold text-capitalize">{field.replace('_', ' ')}</label>
            <input
              type="text"
              name={field}
              value={form[field]}
              className="form-control"
              onChange={handleChange}
              required
            />
          </div>
        ))}

        <div className="form-group mb-3">
          <label className="fw-semibold">Upload New File (optional)</label>
          <input type="file" name="file" className="form-control" onChange={handleChange} />
        </div>

        <div className="text-center">
          <button type="submit" className="btn btn-primary px-5">Resend</button>
        </div>
      </form>
    </div>
  );
}

export default EditCertificateForm;
