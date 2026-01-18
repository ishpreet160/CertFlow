import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-light">
      {/* Hero Section */}
      <header className="bg-white py-20 px-6 text-center shadow-sm">
        <h2 className="display-4 font-weight-bold text-dark mb-4">
          Certification Management <br /><span className="text-primary">Built for Scale.</span>
        </h2>
        <p className="lead text-muted max-w-2xl mx-auto mb-5">
          CertFlow automates project approvals and credential tracking for modern engineering teams. 
          The single source of truth for your professional governance.
        </p>
        <div className="d-flex justify-content-center gap-3">
          <Link to="/login" className="btn btn-primary btn-lg px-5 shadow">
            Login to Dashboard
          </Link>
          {/* Note: In your current logic, /register is PROTECTED. 
              If you want guests to sign up, move /register out of ProtectedRoute in App.js */}
          <Link to="/register" className="btn btn-outline-secondary btn-lg px-5">
            Join the Team
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="container py-5">
        <div className="row g-4 text-center">
          <div className="col-md-4">
            <div className="p-4 bg-white rounded shadow-sm h-100">
              <h4 className="text-primary">Direct Hierarchy</h4>
              <p className="text-muted">Direct manager-employee linkage for seamless project validation.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-4 bg-white rounded shadow-sm h-100">
              <h4 className="text-primary">Instant Exports</h4>
              <p className="text-muted">Generate Excel reports of all verified credentials with one click.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-4 bg-white rounded shadow-sm h-100">
              <h4 className="text-primary">Email Alerts</h4>
              <p className="text-muted">Automatic notifications via SendGrid when your status changes.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;