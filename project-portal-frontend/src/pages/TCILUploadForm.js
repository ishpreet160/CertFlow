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
  const [loading, setLoading] = useState(false);
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

    // Pre-flight check: Prevents the 400 error from hitting the server
    if (!form.pdf) {
      setError("Please select a PDF file.");
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append('name', form.name);
    data.append('valid_from', form.valid_from);
    data.append('valid_till', form.valid_till);
    data.append('pdf', form.pdf);

    try {
      const response = await api.post('/tcil/upload', data);
      setMessage(response.data.msg);
      // Success: Redirect
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      // Capture the exact "Missing fields" message if it still occurs
      const errorMsg = err.response?.data?.msg || 'Upload failed. Check console.';
      setError(errorMsg);
      console.error("Upload Error:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 p-4 shadow rounded bg-white" style={{ maxWidth: '600px' }}>
      <h2 className="text-center mb-4 text-primary">Upload TCIL Certificate</h2>

      {message && <div className="alert alert-success text-center">{message}</div>}
      {error && <div className="alert alert-danger text-center">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="fw-bold">Certificate Name</label>
          <input type="text" name="name" className="form-control" onChange={handleChange} required />
        </div>

        <div className="row mb-3">
          <div className="col">
            <label className="fw-bold">Valid From</label>
            <input type="date" name="valid_from" className="form-control" onChange={handleChange} required />
          </div>
          <div className="col">
            <label className="fw-bold">Valid Till</label>
            <input type="date" name="valid_till" className="form-control" onChange={handleChange} required />
          </div>
        </div>

        <div className="mb-4">
          <label className="fw-bold">Upload PDF</label>
          <input type="file" name="pdf" accept=".pdf" className="form-control" onChange={handleChange} required />
        </div>

        <button className="btn btn-primary w-100" type="submit" disabled={loading}>
          {loading ? "Uploading..." : "Upload Certificate"}
        </button>
      </form>
    </div>
  );
}

export default TCILUploadForm;