import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import * as XLSX from 'xlsx';
import '../styles/dashboard.css';

function Dashboard() {
  const [certificates, setCertificates] = useState([]);
  const [role, setRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const profileRes = await api.get('/profile');
        const userRole = profileRes.data.role;
        setRole(userRole);

        const route = userRole === 'manager' ? '/certificates/all' : '/certificates';
        const certsRes = await api.get(route);
        const certList = Array.isArray(certsRes.data.certificates)
          ? certsRes.data.certificates
          : [];

        setCertificates(certList);
      } catch (err) {
        console.error('Error fetching certificates:', err);
      }
    };

    fetchCertificates();
  }, []);

  const handleUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/certificates/${id}/status`, { status: newStatus });
      
      // Update local state immediately so the badge changes color instantly
      setCertificates(prev => 
        prev.map(cert => cert.id === id ? { ...cert, status: newStatus } : cert)
      );
      
      setMessage(`✅ Certificate ${newStatus} successfully.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to update status.');
    }
  };

  const filteredCertificates = certificates
    .filter(cert =>
      (filterStatus === 'all' || cert.status === filterStatus) &&
      (cert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.client?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'client') return a.client.localeCompare(b.client);
      return new Date(b.uploaded_on) - new Date(a.uploaded_on);
    });

//fixed localhost to api
  const handlePreview = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/certificates/${id}/file`, {
        responseType: 'blob'
      });

      const url = URL.createObjectURL(response.data);
      window.open(url, '_blank');
    } catch (err) {
      alert('Preview failed.The file might be missing on the server.');
    }
  };

  const handleDownload = async (certId) => {
    try {
      const response = await api.get(`/certificates/${certId}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${certId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Download failed.");
    }
  };

  const exportToExcel = (dataToExport, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(
      dataToExport.map(({ title, client, technologies, start_date, end_date, status }) => ({
        Title: title,
        Client: client,
        Technologies: technologies || '—',
        'Start Date': start_date ? new Date(start_date).toLocaleDateString() : '—',
        'End Date': end_date ? new Date(end_date).toLocaleDateString() : '—',
        Status: status,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificates');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  return (
    <div className="container-fluid px-4 py-5">
      <h2 className="dashboard-heading">
        {role === 'manager' ? 'Manager Dashboard' : 'Your Certificates'}
      </h2>

      <div className="filter-panel d-flex flex-wrap gap-3 mb-3">
        <div className="form-group">
          <label className="form-label fw-semibold">Search:</label>
          <input
            type="text"
            placeholder="Search by title/client"
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label fw-semibold">Filter Status:</label>
          <select
            className="form-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label fw-semibold">Sort By:</label>
          <select
            className="form-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="date">Date</option>
            <option value="title">Title</option>
            <option value="client">Client</option>
          </select>
        </div>

        <div className="d-flex align-items-end gap-2 ">

          <button className="btn btn-outline-secondary  px-4  move-down me-2 " style={{ height: '38px'}}  onClick={() =>
            exportToExcel(filteredCertificates, 'Filtered_Certificates')
          }>
             Export Filtered List
          </button>

          <button className="btn btn-outline-secondary px-4  move-down" style={{ height: '38px' }} onClick={() =>
            exportToExcel(certificates, 'All_Certificates')
          }>
             Export To Excel
          </button>
        </div>
      </div>

      {message && (
        <div className="alert alert-info text-center fw-semibold mb-2" role="alert">
          {message}
        </div>
      )}

      <div className="table-container table-responsive">
        {filteredCertificates.length === 0 ? (
          <p className="text-muted text-center">No certificates match this filter.</p>
        ) : (
          <table className="table table-bordered table-striped align-middle">
            <thead className="table-dark">
              <tr>
                <th>S.No</th>
                <th>Title</th>
                <th>Client</th>
                <th>Technologies</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCertificates.map((cert, index) => (
                <tr key={cert.id}>
                  <td>{index + 1}</td>
                  <td>
                    <Link to={`/certificate/${cert.id}`} className="text-primary fw-bold text-decoration-none">
                      {cert.title}
                    </Link>
                  </td>
                  <td>{cert.client}</td>
                  <td>{cert.technologies || '—'}</td>
                  <td>{cert.start_date ? new Date(cert.start_date).toLocaleDateString() : '—'}</td>
                  <td>{cert.end_date ? new Date(cert.end_date).toLocaleDateString() : '—'}</td>
                  <td>
                    <span className={`badge text-capitalize ${
                      cert.status === 'approved' ? 'bg-success' :
                      cert.status === 'rejected' ? 'bg-danger' : 'bg-warning '
                    }`}>
                      {cert.status}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <button className="btn btn-sm btn-outline-dark fw-semibold" onClick={() => handlePreview(cert.id)}>Preview</button>
                      <button className="btn btn-sm btn-outline-dark fw-semibold" onClick={() => handleDownload(cert.id)}>Download</button>

                      {role === 'manager' && cert.status === 'pending' && (
                        <>
                          <button className="btn btn-sm btn-outline-success" onClick={() => handleUpdate(cert.id, 'approved')}>Approve</button>
                          <button className="btn btn-sm btn-outline-danger-reject" onClick={() => handleUpdate(cert.id, 'rejected')}>Reject</button>
                        </>
                      )}

                      {role !== 'manager' && cert.status === 'rejected' && (
                        <Link to={`/certificates/edit/${cert.id}`} className="btn btn-sm btn-outline-warning">
                          Edit & Resubmit
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
