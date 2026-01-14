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
    // CRITICAL FIX: Destructure 'type' and 'files' correctly from e.target
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      // Ensure we grab the actual file object, not the event
      const selectedFile = files[0];
      setForm({ ...form, pdf: selectedFile });
      console.log("File captured successfully:", selectedFile); 
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Logic Check: If pdf is still {}, null, or undefined, STOP.
    if (!form.pdf || !(form.pdf instanceof File)) {
      setError("Please select a valid PDF file. Currently: " + (form.pdf ? "Invalid Object" : "Empty"));
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append('name', form.name);
    data.append('valid_from', form.valid_from);
    data.append('valid_till', form.valid_till);
    data.append('pdf', form.pdf); // Now sending real binary data

    try {
      const response = await api.post('/tcil/upload', data);
      setMessage(response.data.msg || 'Certificate uploaded successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Upload failed. Check server logs.';
      setError(errorMsg);
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