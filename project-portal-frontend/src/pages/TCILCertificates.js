import React, { useEffect, useState } from 'react';
import api from '../api/axios';

function TCILCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
  
    api.get('/tcil/certificates')
      .then(res => {
        setCertificates(res.data.certificates || []);
        setLoading(false);
      })
      .catch(() => {
        setError('❌ Failed to load the TCIL repository.');
        setLoading(false);
      });
  }, []);

  const handleDownload = async (filename) => {
    try {
      const res = await api.get(`/tcil/certificates/${filename}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename); 
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Clean up memory
    } catch (err) {
      alert('Download failed. The file might be missing on the server.');
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div><p>Accessing Repository...</p></div>;

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary fw-bold">🏛️ TCIL Official Repository</h2>
        <span className="badge bg-secondary">Public Access</span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-responsive">
        <table className="table table-hover shadow-sm bg-white rounded">
          <thead className="table-dark">
            <tr>
              <th>Certificate Name</th>
              <th>Valid From</th>
              <th>Valid Till</th>
              <th>Upload Date</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {certificates.length > 0 ? (
              certificates.map(cert => (
                <tr key={cert.id}>
                  <td className="fw-bold">{cert.name}</td>
                  <td>{new Date(cert.valid_from).toLocaleDateString()}</td>
                  <td>{new Date(cert.valid_till).toLocaleDateString()}</td>
                  <td className="text-muted">{new Date(cert.uploaded_on).toLocaleDateString()}</td>
                  <td className="text-center">
                    <button
                      onClick={() => handleDownload(cert.filename)}
                      className="btn btn-sm btn-outline-success"
                    >
                      <i className="bi bi-download"></i> Download
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="text-center p-4">No official certificates available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TCILCertificates;