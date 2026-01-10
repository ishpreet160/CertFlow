import React, { useState } from 'react';
import api from '../api/axios';

function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    client: '',
    nature_of_project: '',
    sub_nature_of_project: '',
    start_date: '',
    go_live_date: '',
    end_date: '',
    warranty_years: '',
    om_years: '',
    value: '',
    project_status: '',
    tcil_contact_person: '',
    technologies: '',
    concerned_hod: '',
    client_contact_name: '',
    client_contact_phone: '',
    client_contact_email: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setMessage('❗ Please select a PDF file.');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();

      // Add fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });

      data.append('file', selectedFile);

      const res = await api.post('/certificates', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage(' Certificate uploaded successfully!');
      setFormData({
        title: '',
        client: '',
        nature_of_project: '',
        sub_nature_of_project: '',
        start_date: '',
        go_live_date: '',
        end_date: '',
        warranty_years: '',
        om_years: '',
        value: '',
        project_status: '',
        tcil_contact_person: '',
        technologies: '',
        concerned_hod: '',
        client_contact_name: '',
        client_contact_phone: '',
        client_contact_email: '',
      });
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || '❗ An error occurred while uploading.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4 mb-5">
      <h2 className="text-center text-primary mb-4">Upload Project Experience Certificate</h2>

      {message && <div className="alert alert-info text-center">{message}</div>}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="row">
          {[
            { label: 'Project Title *', name: 'title', type: 'text', required: true },
            { label: 'Client Name *', name: 'client', type: 'text', required: true },
            { label: 'Nature of Project', name: 'nature_of_project', type: 'text' },
            { label: 'Sub-Nature of Project', name: 'sub_nature_of_project', type: 'text' },
            { label: 'Start Date', name: 'start_date', type: 'date' },
            { label: 'Go-Live Date', name: 'go_live_date', type: 'date' },
            { label: 'End Date', name: 'end_date', type: 'date' },
            { label: 'Warranty Years', name: 'warranty_years', type: 'text' },
            { label: 'O&M Years', name: 'om_years', type: 'text' },
            { label: 'Project Value', name: 'value', type: 'text' },
            { label: 'Project Status', name: 'project_status', type: 'text' },
            { label: 'TCIL Contact Person', name: 'tcil_contact_person', type: 'text' },
            { label: 'Technologies (BOM)', name: 'technologies', type: 'text' },
            { label: 'Concerned HOD', name: 'concerned_hod', type: 'text' },
            { label: 'Client Contact Name', name: 'client_contact_name', type: 'text' },
            { label: 'Client Contact Phone', name: 'client_contact_phone', type: 'text' },
            { label: 'Client Contact Email', name: 'client_contact_email', type: 'email' },
          ].map(({ label, name, type, required }, idx) => (
            <div className="col-md-6" key={idx}>
              <label>{label}</label>
              <input
                className="form-control mb-3"
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required={required}
              />
            </div>
          ))}

          <div className="col-md-12">
            <label>Upload Project Document (PDF only)</label>
            <input
              type="file"
              className="form-control mb-3"
              onChange={handleFileChange}
              accept="application/pdf"
              required
            />
          </div>
        </div>

        <div className="text-center">
          <button type="submit" className="btn btn-success mt-3" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Certificate'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UploadPage;
