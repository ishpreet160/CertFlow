import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

function EditCertificateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    title: '', client: '', nature_of_project: 'IT', sub_nature_of_project: 'Data Centre',
    start_date: '', go_live_date: '', end_date: '',
    warranty_years: '', om_years: '', value: '',
    project_status: '', tcil_contact_person: '', technologies: '',
    concerned_hod: '', client_contact_name: '', client_contact_phone: '',
    client_contact_email: '', file: null
  });

  useEffect(() => {
    api.get(`/certificates/all`).then((res) => {
      const cert = res.data.find(c => c.id === parseInt(id));
      if (cert) setForm({ ...cert, file: null });
    }).catch(() => setError('Failed to load data.'));
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(form).forEach(key => {
      if (form[key] !== null) data.append(key, form[key]);
    });

    try {
      await api.put(`/certificates/${id}`, data);
      setMessage('✅ Resubmitted for approval.');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    }
  };

  return (
    <div className="container mt-4 mb-5 p-4 shadow-lg rounded bg-light">
      <h2 className="text-center text-dark border-bottom pb-3 mb-4">Edit Certificate (Annexure-1)</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <form onSubmit={handleSubmit} className="row g-3">
        
        <div className="col-md-6">
          <label className="form-label fw-bold">Project Title</label>
          <input type="text" name="title" className="form-control" value={form.title} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-bold">Client Name</label>
          <input type="text" name="client" className="form-control" value={form.client} onChange={handleChange} required />
        </div>

       
        <div className="col-md-6">
          <label className="form-label fw-bold">Nature of Project</label>
          <select name="nature_of_project" className="form-select" value={form.nature_of_project} onChange={handleChange}>
            <option value="IT">IT</option>
            <option value="ITes">ITes</option>
            <option value="Civil">Civil</option>
            <option value="Telecom">Telecom</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-bold">Sub-Nature</label>
          <select name="sub_nature_of_project" className="form-select" value={form.sub_nature_of_project} onChange={handleChange}>
            <option value="Data Centre">Data Centre</option>
            <option value="ERP">ERP</option>
            <option value="CCTV Surveillance">CCTV Surveillance</option>
            <option value="Software Development">Software Development</option>
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label fw-bold">Start Date</label>
          <input type="date" name="start_date" className="form-control" value={form.start_date} onChange={handleChange} />
        </div>
        <div className="col-md-4">
          <label className="form-label fw-bold">Go-Live Date</label>
          <input type="date" name="go_live_date" className="form-control" value={form.go_live_date} onChange={handleChange} />
        </div>
        <div className="col-md-4">
          <label className="form-label fw-bold">End Date</label>
          <input type="date" name="end_date" className="form-control" value={form.end_date} onChange={handleChange} />
        </div>

        
        <div className="col-md-4">
          <label className="form-label fw-bold">Value (incl. taxes)</label>
          <input type="text" name="value" className="form-control" value={form.value} onChange={handleChange} />
        </div>
        <div className="col-md-4">
          <label className="form-label fw-bold">Warranty (Years)</label>
          <input type="number" name="warranty_years" className="form-control" value={form.warranty_years} onChange={handleChange} />
        </div>
        <div className="col-md-4">
          <label className="form-label fw-bold">O&M Years</label>
          <input type="number" name="om_years" className="form-control" value={form.om_years} onChange={handleChange} />
        </div>

        
        <div className="col-12 bg-secondary text-white p-2 rounded mt-3">Client Contact Details</div>
        <div className="col-md-4">
          <label className="form-label fw-bold">Name</label>
          <input type="text" name="client_contact_name" className="form-control" value={form.client_contact_name} onChange={handleChange} />
        </div>
        <div className="col-md-4">
          <label className="form-label fw-bold">Phone</label>
          <input type="text" name="client_contact_phone" className="form-control" value={form.client_contact_phone} onChange={handleChange} />
        </div>
        <div className="col-md-4">
          <label className="form-label fw-bold">Email</label>
          <input type="email" name="client_contact_email" className="form-control" value={form.client_contact_email} onChange={handleChange} />
        </div>

        <div className="col-12">
          <label className="form-label fw-bold">Technologies (Upload BOM)</label>
          <textarea name="technologies" className="form-control" value={form.technologies} onChange={handleChange}></textarea>
        </div>

        <div className="col-12">
          <label className="form-label fw-bold">Update Certificate PDF (Optional)</label>
          <input type="file" name="file" className="form-control" onChange={handleChange} accept=".pdf" />
        </div>

        <div className="col-12 text-center mt-4">
          <button type="submit" className="btn btn-primary btn-lg w-50">RESUBMIT FOR APPROVAL</button>
        </div>
      </form>
    </div>
  );
}

export default EditCertificateForm;