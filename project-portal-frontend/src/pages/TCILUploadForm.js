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
    // FIX: Must destructure 'type' here to use it in the logic below
    const { name, value, files, type } = e.target;

    if (type === 'file') {
      // Capture the actual File object, not an empty object
      const selectedFile = files[0];
      console.log("File selected:", selectedFile); 
      setForm({ ...form, pdf: selectedFile });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Pre-flight check: Ensure pdf is a real File instance
    if (!(form.pdf instanceof File)) {
      setError("Please select a valid PDF file.");
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append('name', form.name);
    data.append('valid_from', form.valid_from);
    data.append('valid_till', form.valid_till);
    data.append('pdf', form.pdf); // Sending binary data now

    try {
      const response = await api.post('/tcil/upload', data);
      setMessage(response.data.msg || 'Certificate uploaded successfully!');
      
      // Success: Clear form and redirect
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      // Catch specific backend error like "Missing fields" or "Invalid date"
      const errorMsg = err.response?.data?.msg || 'Upload failed. Please try again.';
      setError(errorMsg);
      console.error("Upload Error Details:", err.response?.data);
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
          <input 
            type="text" 
            name="name" 
            className="form-control" 
            placeholder="e.g. ISO 9001:2015"
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="row mb-3">
          <div className="col">
            <label className="fw-bold">Valid From</label>
            <input 
              type="date" 
              name="valid_from" 
              className="form-control" 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="col">
            <label className="fw-bold">Valid Till</label>
            <input 
              type="date" 
              name="valid_till" 
              className="form-control" 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="fw-bold">Upload PDF</label>
          <input 
            type="file" 
            name="pdf" 
            accept=".pdf" 
            className="form-control" 
            onChange={handleChange} 
            required 
          />
        </div>

        <button className="btn btn-primary w-100 py-2 fw-bold" type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Uploading...
            </>
          ) : (
            "Upload Certificate"
          )}
        </button>
      </form>
    </div>
  );
}

export default TCILUploadForm;