import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import * as XLSX from 'xlsx';
import '../styles/dashboard.css';


function Dashboard() {
  const [certificates, setCertificates] = useState([]);
  const [role] = useState(localStorage.getItem('userRole') || ''); 
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        // Admins and Managers use the 'all' route; Employees use their own.
        const route = '/certificates/all';
          
        const certsRes = await api.get(route);
        const certList = Array.isArray(certsRes.data) ? certsRes.data : [];
        setCertificates(certList);

        setCertificates(certList);
      } catch (err) {
        console.error('Error fetching certificates:', err);
        setMessage('❌ Failed to load certificates.');
      } finally {
        setLoading(false);
      }
    };

    if (role) fetchCertificates();
  }, [role]);

  const handleUpdate = async (id, newStatus) => {
    try {
      
      await api.patch(`/certificates/${id}/status`, { status: newStatus });
      
      setCertificates(prev => 
        prev.map(cert => cert.id === id ? { ...cert, status: newStatus } : cert)
      );
      
      setMessage(`✅ Certificate ${newStatus} successfully.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`❌ Action failed: ${err.response?.data?.message || "Server Error"}`);
    }
  };

  const handlePreview = (url) => {
    if (!url) return alert("File URL not found.");
    // Since it's a Supabase Public URL, we just open it
    window.open(url, '_blank', 'noopener,noreferrer');
  };

const handleDownload = (url, title) => {
    if (!url) return alert("File URL not found.");
    // We create a temporary link to force the browser to download the cloud file
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title || 'certificate'}.pdf`);
    link.setAttribute('target', '_blank'); // Ensures it works across browsers
    document.body.appendChild(link);
    link.click();
    link.remove();
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

  return (
    <div className="container-fluid px-4 py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="dashboard-heading mb-0 text-primary fw-bold">
          {role.toUpperCase()} DASHBOARD
        </h2>
        {/* Only Admins and Managers can see the user registration portal. */}
        {(role === "admin" || role === "manager") && (
          <Link to="/register" className="btn btn-primary shadow-sm">
            + Register New User
          </Link>
        )}
      </div>

      <div className="filter-panel d-flex flex-wrap gap-3 mb-4 p-3 bg-light rounded shadow-sm">
        <div className="flex-grow-1">
          <label className="form-label fw-bold">Search</label>
          <input
            type="text"
            placeholder="Title or Client..."
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label fw-bold">Status</label>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label className="form-label fw-bold">Sort By</label>
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Newest First</option>
            <option value="title">Alphabetical (Title)</option>
            <option value="client">Alphabetical (Client)</option>
          </select>
        </div>
        <div className="col-md-9 d-flex align-items-end justify-content-end">
          <button
            className="btn btn-success shadow-sm"
            onClick={() =>
              exportToExcel(filteredCertificates, "CertFlow_Report")
            }
          >
            <i className="bi bi-file-earmark-spreadsheet"></i> Export Filtered
            to Excel
          </button>
        </div>
      </div>

      {message && (
        <div className="alert alert-info text-center fw-bold">{message}</div>
      )}

      <div className="table-responsive bg-white rounded shadow-sm">
        {loading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <p className="text-muted text-center p-5">No certificates found.</p>
        ) : (
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Title</th>
                <th>Client</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCertificates.map((cert) => (
                <tr key={cert.id}>
                  <td>
                    <Link
                      to={`/certificate/${cert.id}`}
                      className="fw-bold text-decoration-none text-dark"
                    >
                      {cert.title}
                    </Link>
                  </td>
                  <td>{cert.client}</td>
                  <td>
                    <span
                      className={`badge rounded-pill ${
                        cert.status === "approved"
                          ? "bg-success"
                          : cert.status === "rejected"
                            ? "bg-danger"
                            : "bg-warning text-dark"
                      }`}
                    >
                      {cert.status}
                    </span>
                  </td>
                  <td>
                    {cert.timestamp
                      ? new Date(cert.timestamp).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      {/* Pass cert.filename (the URL) directly to the functions */}
                      <button
                        className="btn btn-sm btn-light border"
                        onClick={() => handlePreview(cert.filename)}
                      >
                        Preview
                      </button>
                      <button
                        className="btn btn-sm btn-light border"
                        onClick={() =>
                          handleDownload(cert.filename, cert.title)
                        }
                      >
                        Download
                      </button>
                      {/* Manager-only Approval Controls */}
                      {role === "manager" && cert.status === "pending" && (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleUpdate(cert.id, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleUpdate(cert.id, "rejected")}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* Employee-only Edit for Rejected */}
                      {role === "employee" && cert.status === "rejected" && (
                        <Link
                          to={`/certificates/edit/${cert.id}`}
                          className="btn btn-sm btn-warning"
                        >
                          Edit
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