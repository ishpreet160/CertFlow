import React from 'react';
import api from '../api/axios';

function DownloadButton({ certId }) {
  const handleDownload = async () => {
    try {
      const res = await api.get(`/certificates/${certId}/download`, {
        responseType: 'blob', // important for downloading files
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${certId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove(); // clean up
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed. Please try again.');
      console.error('Download error:', err);
    }
  };

  return (
    <button className="btn btn-outline-primary mt-2" onClick={handleDownload}>
       Download Certificate
    </button>
  );
}

export default DownloadButton;
