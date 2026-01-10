import React, { useEffect, useState } from 'react';
import api from '../api/axios';

function ManagerTCILCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await api.get('/tcil/certificates');
        setCertificates(res.data.certificates);
      } catch (err) {
        setError('Failed to fetch TCIL Certificates. Are you logged in as manager?');
      }
    };

    fetchCertificates();
  }, []);

  const handleDownload = async (filename) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/tcil/certificates/${filename}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Download failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Download failed. Please check your login or permissions.');
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-primary fw-bold"> TCIL Certificates</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <table className="table table-bordered table-hover shadow">
        <thead className="table-primary">
          <tr>
            <th>Name</th>
            <th>Valid From</th>
            <th>Valid Till</th>
            <th>Uploaded On</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {certificates.map(cert => (
            <tr key={cert.id}>
              <td>{cert.name}</td>
              <td>{cert.valid_from}</td>
              <td>{cert.valid_till}</td>
              <td>{cert.uploaded_on}</td>
              <td>
                <button
                  onClick={() => handleDownload(cert.filename)}
                  className="btn btn-sm btn-success"
                >
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ManagerTCILCertificates;
