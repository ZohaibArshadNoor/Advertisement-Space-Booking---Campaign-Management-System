import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container mt-4">
      <div className="p-5 mb-4 bg-light rounded-3 shadow-sm">
        <h1 className="display-6 fw-bold">Welcome, {user?.name}!</h1>
        <p className="lead text-muted">Role: <span className="badge bg-secondary">{user?.role}</span></p>
        <hr className="my-4" />
        <p>Your authentication flow is completely wired to the Flask backend.</p>
      </div>
    </div>
  );
};

export default Dashboard;