import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { getStats } from '../api/customer';
import { FiSend, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, delivered: 0, failed: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p>Overview of your WhatsApp template campaigns</p>
      </div>
      <div className="stats">
        <div className="stat-card total">
          <div className="stat-icon">
            <FiSend />
          </div>
          <div className="stat-content">
            <h3>Total Templates Sent</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <h3>Delivered</h3>
            <p className="stat-number">{stats.delivered}</p>
          </div>
        </div>
        <div className="stat-card failed">
          <div className="stat-icon">
            <FiXCircle />
          </div>
          <div className="stat-content">
            <h3>Failed</h3>
            <p className="stat-number">{stats.failed}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
