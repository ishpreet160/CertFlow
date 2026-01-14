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
  const [loading, setLoading] = useState(false); // Added loading state
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
    setLoading(true); // Start loading

    const data = new FormData();
    data.append('name', form.name);
    data.append('valid_from', form.valid_from);
    data.append('valid_till', form.valid_till);
    data.append('pdf', form.pdf); // Key matches backend request.files.get('pdf')

    try {
      const response = await api.post('/tcil/upload', data);
      setMessage(response.data.msg || 'Certificate uploaded successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      // Capture specific error message from backend
      const errorMsg = err.response?.data?.msg || 'Upload failed. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false); // End loading
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
          <input type="text" name="name" className="form-control" placeholder="ISO 9001..." onChange={handleChange} required />
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="fw-semibold">Valid From</label>
            <input type="date" name="valid_from" className="form-control" onChange={handleChange} required />
          </div>
          <div className="col-md-6 mb-3">
            <label className="fw-semibold">Valid Till</label>
            <input type="date" name="valid_till" className="form-control" onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group mb-4">
          <label className="fw-semibold">Upload PDF</label>
          <input type="file" name="pdf" accept=".pdf" className="form-control" onChange={handleChange} required />
        </div>

        <div className="text-center">
          <button className="btn btn-primary px-5 w-100" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              "Upload Certificate"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TCILUploadForm;