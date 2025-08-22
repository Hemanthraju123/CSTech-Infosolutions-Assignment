import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const Signup = ({ onSignupSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/register', {
        email: formData.email,
        password: formData.password
      });

      toast.success('Account created successfully! Please login.');
      onSignupSuccess();
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="card" style={{ minWidth: '400px', maxWidth: '500px' }}>
        <div className="card-header">
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🚀</div>
            <h2 className="card-title">Welcome to MERN Stack App</h2>
            <p style={{ marginTop: '10px', color: '#666' }}>
              Create your admin account to get started
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password (min 6 characters)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-control"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div style={{ 
          marginTop: '20px', 
          textAlign: 'center', 
          color: '#666',
          fontSize: '14px'
        }}>
          <p>Already have an account?</p>
          <button
            onClick={onSignupSuccess}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Click here to login
          </button>
        </div>

        <div style={{ 
          marginTop: '20px', 
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          fontSize: '12px',
          color: '#666'
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>What you'll be able to do:</p>
          <ul style={{ margin: '0', paddingLeft: '20px' }}>
            <li>Manage agents and their assignments</li>
            <li>Upload CSV/Excel files for distribution</li>
            <li>Monitor data distribution among agents</li>
            <li>View comprehensive dashboard and statistics</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Signup;
