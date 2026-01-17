import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 border-b">
        <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight">CertFlow</h1>
        <Link to="/login" className="text-gray-600 font-semibold hover:text-blue-600">Login</Link>
      </nav>

      {/* Hero Section */}
      <header className="py-20 px-6 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Certification Management <br /><span className="text-blue-600">Built for Scale.</span>
        </h2>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          CertFlow automates project approvals and credential tracking for modern engineering teams. 
          
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/register" className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-700 shadow-lg">
            Get Started
          </Link>
          <a href="#features" className="bg-gray-100 text-gray-800 px-8 py-4 rounded-lg font-bold hover:bg-gray-200">
            View Features
          </a>
        </div>
      </header>
    </div>
  );
};

export default Home;