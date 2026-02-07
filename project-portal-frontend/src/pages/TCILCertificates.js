import React, { useEffect, useState } from "react";
import api from "../api/axios";

function TCILCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUserId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");

  const fetchCertificates = async () => {
    try {
      const res = await api.get("/tcil/certificates");
      setCertificates(res.data.certificates || []);
    } catch (err) {
      setError("❌ Failed to load the TCIL repository.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleDelete = async (id) => {
    // confirmation popup
    const confirmed = window.confirm(
      "Are you sure you want to delete this certificate? This action cannot be undone.",
    );

    if (confirmed) {
      try {
        await api.delete(`/tcil/certificates/${id}`);
        // Update state locally
        setCertificates(certificates.filter((cert) => cert.id !== id));
      } catch (err) {
        alert(err.response?.data?.message || "Deletion failed.");
      }
    }
  };

 const handleDownload = async (fileUrl, fileName) => {
  try {
    // 1. Fetch the file data as a blob
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    
    // 2. Create a local object URL for the blob
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // 3. Force download attribute
    link.setAttribute("download", fileName || "document.pdf");
    document.body.appendChild(link);
    link.click();
    
    // 4. Cleanup
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    // Fallback: If blob fetch fails (CORS), open in new tab
    window.open(fileUrl, "_blank");
  }
};
  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary"></div>
        <p>Accessing Repository...</p>
      </div>
    );

  // ... (imports and state logic remain the same)

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary fw-bold">🏛️ TCIL Official Repository</h2>
        <span className="badge bg-secondary">Public Access</span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="table-responsive">
        <table className="table table-hover shadow-sm bg-white rounded align-middle">
          <thead className="table-dark">
            <tr>
              <th>Certificate Name</th>
              <th>Uploaded By</th>
              <th>Valid From</th>
              <th>Valid Till</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {certificates.length > 0 ? (
              certificates.map((cert) => (
                <tr key={cert.id}>
                  <td className="fw-bold">{cert.name}</td>
                  <td className="small text-secondary">
                    {cert.uploaded_by || "System"}
                  </td>
                  <td>{new Date(cert.valid_from).toLocaleDateString()}</td>
                  <td>{new Date(cert.valid_till).toLocaleDateString()}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      {/* PROPER PREVIEW BUTTON */}
                      <a
                        href={cert.filename}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary shadow-sm px-3"
                        title="View Certificate"
                      >
                        <i className="bi bi-eye-fill"></i> Preview
                      </a>

                      {/* PROPER DOWNLOAD BUTTON */}
                      <button
                        onClick={() => handleDownload(cert.filename, cert.name)}
                        className="btn btn-sm btn-success shadow-sm px-3"
                        title="Download PDF"
                      >
                        <i className="bi bi-cloud-arrow-down-fill"></i> Download
                      </button>

                      {/* DELETE BUTTON */}
                      {(Number(cert.uploader_id) === Number(currentUserId) ||
                        userRole === "admin") && (
                        <button
                          onClick={() => handleDelete(cert.id)}
                          className="btn btn-sm btn-outline-danger shadow-sm"
                          title="Delete"
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  No official certificates available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TCILCertificates;
