import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

function TCILUploadForm() {
  const [form, setForm] = useState({
    name: '',
    valid_from: '',
    valid_till: '',
    pdf: null
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'pdf') {
      setForm({ ...form, pdf: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const data = new FormData();
    data.append('name', form.name);
    data.append('valid_from', form.valid_from);
    data.append('valid_till', form.valid_till);
    data.append('pdf', form.pdf);

    try {
      await api.post('/tcil/upload', data);
      setMessage(' Certificate uploaded successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(' Upload failed. Please try again.');
    }
  };

  return (
    <div className="container mt-5 p-4 shadow rounded bg-white" style={{ maxWidth: '600px' }}>
      <h2 className="text-center mb-4 text-primary">Upload TCIL Certificate</h2>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group mb-3">
          <label className="fw-semibold">Certificate Name</label>
          <input
            type="text"
            name="name"
            className="form-control"
            placeholder="Enter certificate name"
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group mb-3">
          <label className="fw-semibold">Valid From</label>
          <input
            type="date"
            name="valid_from"
            className="form-control"
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group mb-3">
          <label className="fw-semibold">Valid Till</label>
          <input
            type="date"
            name="valid_till"
            className="form-control"
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group mb-4">
          <label className="fw-semibold">Upload PDF</label>
          <input
            type="file"
            name="pdf"
            accept=".pdf"
            className="form-control"
            onChange={handleChange}
            required
          />
        </div>

        <div className="text-center">
          <button className="btn btn-primary px-5" type="submit">
            Upload
          </button>
        </div>
      </form>
    </div>
  );
}

export default TCILUploadForm;
