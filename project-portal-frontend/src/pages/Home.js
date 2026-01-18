import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center text-center">
       <div className="text-center mb-5 pb-4">
          <h1 className="display-4 fw-bold text-dark mb-3">
            Certification Management <br />
            <span className="text-primary">Built for Scale.</span>
          </h1>
          <p className="lead text-muted mb-5 px-md-5">
            CertFlow automates project approvals and credential tracking for modern engineering teams.
          </p>
          <div className="d-flex justify-content-center gap-3 mb-5">
            <Link to="/login" className="btn btn-primary btn-lg px-5 shadow-sm">Login</Link>
            <Link to="/register" className="btn btn-outline-dark btn-lg px-5">Join Team</Link>
          </div>
          

          {/* Feature Grid - Glued to the Hero */}
          <div className="row g-4 mt-2">
            <div className="col-md-6">
              <div className="card h-100 border-0 shadow-sm p-4">
                <h4 className="text-primary fw-bold">Direct Hierarchy</h4>
                <p className="small text-muted mb-0">Direct manager-employee linkage for seamless validation.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100 border-0 shadow-sm p-4">
                <h4 className="text-primary fw-bold">Instant Exports</h4>
                <p className="small text-muted mb-0">Generate Excel reports of all verified credentials instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Home;