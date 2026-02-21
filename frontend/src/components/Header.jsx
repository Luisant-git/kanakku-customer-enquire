import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/login';
    }
  };

  return (
    <header className="header">
      <h1>Rathna Vilas</h1>
      <div className="header-right">
        <span className="user-info">Admin</span>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </header>
  );
};

export default Header;
