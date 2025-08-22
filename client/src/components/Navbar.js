import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" className="navbar-brand">
            MERN Stack App
          </Link>
          
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link to="/" className={isActive('/')}>
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/agents" className={isActive('/agents')}>
                Agents
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/lists" className={isActive('/lists')}>
                Lists
              </Link>
            </li>
            <li className="nav-item">
              <span style={{ color: '#adb5bd', marginRight: '15px' }}>
                Welcome, {user?.email}
              </span>
              <button 
                onClick={onLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#adb5bd',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
