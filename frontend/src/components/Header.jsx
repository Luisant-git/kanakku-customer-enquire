import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import { FiMenu, FiX } from 'react-icons/fi';
import './Header.css';

const Header = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/login';
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    if (onMenuToggle) onMenuToggle(!menuOpen);
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleMenu}>
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
        <h1>Rathna Vilas</h1>
      </div>
      <div className="header-right">
        <span className="user-info">Admin</span>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </header>
  );
};

export default Header;
