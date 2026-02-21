import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <nav>
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Dashboard
        </Link>
        <Link to="/customers" className={location.pathname === '/customers' ? 'active' : ''}>
          Customers
        </Link>
        <Link to="/template-config" className={location.pathname === '/template-config' ? 'active' : ''}>
          Template Config
        </Link>
        <Link to="/send-template" className={location.pathname === '/send-template' ? 'active' : ''}>
          Send Template
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
