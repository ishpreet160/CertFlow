import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

function TCILUploadForm() {
  const [form, setForm] = useState({ name: '', valid_from: '', valid_till: '' });
  const [file, setFile] = useState(null); // Keep file in its own state to avoid {} issues
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle text inputs
  const handleTextChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle file input separately - THIS IS THE FIX
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      console.log("File captured:", e.target.files[0].name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Hard validation: If no file, don't even talk to the server
    if (!file) {
      setError("The PDF is missing. Please select a file again.");
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append('name', form.name);
    data.append('valid_from', form.valid_from);
    data.append('valid_till', form.valid_till);
    data.append('pdf', file); // 'file' is now the actual binary, not {}

    try {
      const response = await api.post('/tcil/upload', data);
      setMessage(response.data.msg);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.msg || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 p-4 shadow rounded bg-white" style={{ maxWidth: '600px' }}>
      <h2 className="text-center mb-4 text-primary">Upload TCIL Certificate</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="fw-bold">Certificate Name</label>
          <input type="text" name="name" className="form-control" onChange={handleTextChange} required />
        </div>
        <div className="row mb-3">
          <div className="col">
            <label className="fw-bold">Valid From</label>
            <input type="date" name="valid_from" className="form-control" onChange={handleTextChange} required />
          </div>
          <div className="col">
            <label className="fw-bold">Valid Till</label>
            <input type="date" name="valid_till" className="form-control" onChange={handleTextChange} required />
          </div>
        </div>
        <div className="mb-4">
          <label className="fw-bold">Upload PDF</label>
          <input type="file" accept=".pdf" className="form-control" onChange={handleFileChange} required />
        </div>
        <button className="btn btn-primary w-100" type="submit" disabled={loading}>
          {loading ? "Processing..." : "Upload Certificate"}
        </button>
      </form>
    </div>
  );
}

export default TCILUploadForm;