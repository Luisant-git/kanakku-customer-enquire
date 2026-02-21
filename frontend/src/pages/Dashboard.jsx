import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="stats">
        <div className="stat-card">
          <h3>Total Customers</h3>
          <p className="stat-number">0</p>
        </div>
        <div className="stat-card">
          <h3>Active Conversations</h3>
          <p className="stat-number">0</p>
        </div>
        <div className="stat-card">
          <h3>Templates Sent</h3>
          <p className="stat-number">0</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
