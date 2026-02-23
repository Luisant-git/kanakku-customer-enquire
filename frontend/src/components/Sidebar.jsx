import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiSettings, FiSend } from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <nav>
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'active' : ''}
            onClick={handleLinkClick}
          >
            <FiHome /> Dashboard
          </Link>
          <Link 
            to="/customers" 
            className={location.pathname === '/customers' ? 'active' : ''}
            onClick={handleLinkClick}
          >
            <FiUsers /> Customers
          </Link>
          <Link 
            to="/template-config" 
            className={location.pathname === '/template-config' ? 'active' : ''}
            onClick={handleLinkClick}
          >
            <FiSettings /> Template Config
          </Link>
          <Link 
            to="/send-template" 
            className={location.pathname === '/send-template' ? 'active' : ''}
            onClick={handleLinkClick}
          >
            <FiSend /> Send Template
          </Link>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
