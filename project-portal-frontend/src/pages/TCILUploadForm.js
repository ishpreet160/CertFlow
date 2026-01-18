import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

function TCILUploadForm() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  const [name, setName] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTill, setValidTill] = useState('');
  const [file, setFile] = useState(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  //  Redirect if not a Manager
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Ensure it's a valid File object
    if (!file || !(file instanceof File)) {
      setError("Please select a valid PDF file.");
      return;
    }

    setLoading(true);
    
    // Create FormData for Multipart/Form-Data transmission
    const data = new FormData();
    data.append('name', name);
    data.append('valid_from', validFrom);
    data.append('valid_till', validTill);
    data.append('pdf', file); 

    try {
      // Axios interceptor handles the JWT automatically
      const response = await api.post('/tcil/upload', data);
      
      setMessage(`✅ ${response.data.msg || 'TCIL Certificate uploaded successfully!'}`);
      
      // Clear form on success
      setName('');
      setFile(null);
      
      // Redirect to Dashboard after a short delay
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      const serverMsg = err.response?.data?.msg || 'Upload failed. Check file size or permissions.';
      setError(`❌ ${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 p-4 shadow rounded bg-white" style={{ maxWidth: '600px' }}>
      <h2 className="text-center mb-1 text-primary fw-bold">Upload TCIL Certificate</h2>
      <p className="text-center text-muted mb-4 small">
        Standard Corporate Certificate Repository
      </p>
      
      {message && <div className="alert alert-success fw-bold text-center">{message}</div>}
      {error && <div className="alert alert-danger fw-bold text-center">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-bold text-secondary">Certificate/Project Name</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. TCIL Network Expansion 2026"
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
        </div>

        <div className="row mb-3">
          <div className="col">
            <label className="form-label fw-bold text-secondary">Valid From</label>
            <input 
              type="date" 
              className="form-control" 
              value={validFrom} 
              onChange={(e) => setValidFrom(e.target.value)} 
              required 
            />
          </div>
          <div className="col">
            <label className="form-label fw-bold text-secondary">Valid Till</label>
            <input 
              type="date" 
              className="form-control" 
              value={validTill} 
              onChange={(e) => setValidTill(e.target.value)} 
              required 
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label fw-bold text-secondary">Select PDF Document</label>
          <input 
            type="file" 
            accept=".pdf" 
            className="form-control" 
            onChange={(e) => setFile(e.target.files[0])} 
            required 
          />
          <div className="form-text">Ensure the file is under 10MB and in PDF format.</div>
        </div>

        <button 
          className="btn btn-primary w-100 py-2 fw-bold shadow-sm" 
          type="submit" 
          disabled={loading}
        >
          {loading ? (
            <span className="spinner-border spinner-border-sm me-2"></span>
          ) : null}
          {loading ? "PROCESSING UPLOAD..." : "PUBLISH CERTIFICATE"}
        </button>
      </form>
    </div>
  );
}

export default TCILUploadForm;