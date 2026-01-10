import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

function EditCertificateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    client: '',
    technologies: '',
    project_status: '',
    value: '',
    file: null
  });

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // 🔁 Fetch existing cert details
    api.get(`/certificates/${id}`)
      .then((res) => {
        const data = res.data;
        setForm({
          title: data.title,
          client: data.client,
          technologies: data.technologies || '',
          project_status: data.project_status || '',
          value: data.value || '',
          file: null
        });
      })
      .catch(() => setError('Failed to load certificate'));
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setForm({ ...form, file: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', form.title);
    data.append('client', form.client);
    data.append('technologies', form.technologies);
    data.append('project_status', form.project_status);
    data.append('value', form.value);
    if (form.file) {
      data.append('file', form.file);
    }

    api.patch(`/certificates/${id}`, data)
      .then(() => {
        setMessage('Updated and Resent for approval!');
        setTimeout(() => navigate('/dashboard'), 1500);
      })
      .catch(() => setError('Update failed.'));
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
