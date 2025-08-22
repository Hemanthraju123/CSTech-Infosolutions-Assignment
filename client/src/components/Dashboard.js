import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalLists: 0,
    recentUploads: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [agentsResponse, listsResponse, summaryResponse] = await Promise.all([
        axios.get('/api/agents'),
        axios.get('/api/lists'),
        axios.get('/api/lists/summary')
      ]);

      setStats({
        totalAgents: agentsResponse.data.length,
        totalLists: listsResponse.data.length,
        recentUploads: listsResponse.data.slice(0, 5),
        distribution: summaryResponse.data.distribution || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading dashboard...</div>;
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome to your MERN Stack Application</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.totalAgents}</div>
          <div className="stat-label">Total Agents</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{stats.totalLists}</div>
          <div className="stat-label">Total Lists</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{stats.distribution?.length || 0}</div>
          <div className="stat-label">Active Distributions</div>
        </div>
      </div>

      {stats.distribution && stats.distribution.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Distribution Summary</h3>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Email</th>
                  <th>Assigned Items</th>
                </tr>
              </thead>
              <tbody>
                {stats.distribution.map((agent) => (
                  <tr key={agent.agentId}>
                    <td>{agent.agentName}</td>
                    <td>{agent.agentEmail}</td>
                    <td>
                      <span className="badge badge-info">{agent.count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.recentUploads && stats.recentUploads.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Uploads</h3>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>First Name</th>
                  <th>Phone</th>
                  <th>Notes</th>
                  <th>Assigned Agent</th>
                  <th>Upload Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentUploads.map((item) => (
                  <tr key={item._id}>
                    <td>{item.firstName}</td>
                    <td>{item.phone}</td>
                    <td>{item.notes || '-'}</td>
                    <td>{item.agentId?.name || 'Unknown'}</td>
                    <td>{new Date(item.uploadedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats.totalAgents === 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Getting Started</h3>
          </div>
          <div className="card-body">
            <p>Welcome! To get started with the application:</p>
            <ol style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li>First, create some agents using the Agents page</li>
              <li>Then upload CSV/XLSX files to distribute lists among agents</li>
              <li>Monitor the distribution and manage your data</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
