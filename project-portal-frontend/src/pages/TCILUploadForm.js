import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

function TCILUploadForm() {
  const [name, setName] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTill, setValidTill] = useState('');
  const [file, setFile] = useState(null); // This MUST stay a File object

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // DEBUG: This will tell us EXACTLY what is in the state before we send it
    console.log("Submit Clicked. File State:", file);

    if (!file || !(file instanceof File)) {
      setError("Browser error: File not captured. Please click 'Browse' and select the PDF again.");
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append('name', name);
    data.append('valid_from', validFrom);
    data.append('valid_till', validTill);
    data.append('pdf', file); 

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
      <h2 className="text-center mb-4 text-primary fw-bold">Upload TCIL Certificate</h2>
      
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="fw-bold">Certificate Name</label>
          <input 
            type="text" 
            className="form-control" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
        </div>

        <div className="row mb-3">
          <div className="col">
            <label className="fw-bold">Valid From</label>
            <input 
              type="date" 
              className="form-control" 
              value={validFrom} 
              onChange={(e) => setValidFrom(e.target.value)} 
              required 
            />
          </div>
          <div className="col">
            <label className="fw-bold">Valid Till</label>
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
          <label className="fw-bold">Upload PDF</label>
          <input 
            type="file" 
            accept=".pdf" 
            className="form-control" 
            onChange={(e) => {
              console.log("Input Change Detected:", e.target.files[0]);
              setFile(e.target.files[0]);
            }} 
            required 
          />
        </div>

        <button className="btn btn-primary w-100 py-2 fw-bold" type="submit" disabled={loading}>
          {loading ? "COMMUNICATING WITH SERVER..." : "UPLOAD NOW"}
        </button>
      </form>
    </div>
  );
}

export default TCILUploadForm;