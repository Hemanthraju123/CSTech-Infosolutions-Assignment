import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const Lists = () => {
  const [lists, setLists] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgent, setFilterAgent] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [listsResponse, agentsResponse] = await Promise.all([
        axios.get('/api/lists'),
        axios.get('/api/agents')
      ]);
      setLists(listsResponse.data);
      setAgents(agentsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    
    if (allowedTypes.includes(file.type) || allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      setSelectedFile(file);
    } else {
      toast.error('Please select a valid CSV, XLSX, or XLS file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (agents.length === 0) {
      toast.error('No agents found. Please create agents first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    try {
      const response = await axios.post('/api/lists/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(response.data.message);
      setSelectedFile(null);
      fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (listId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`/api/lists/${listId}`);
        toast.success('Item deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  };

  const handleDeleteByFile = async (filename) => {
    if (window.confirm(`Are you sure you want to delete all items from "${filename}"?`)) {
      try {
        await axios.delete(`/api/lists/file/${encodeURIComponent(filename)}`);
        toast.success('File items deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete file items');
      }
    }
  };

  const filteredLists = lists.filter(list => {
    const matchesSearch = list.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         list.phone.includes(searchTerm) ||
                         list.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAgent = !filterAgent || list.agentId._id === filterAgent;
    return matchesSearch && matchesAgent;
  });

  const getUniqueFiles = () => {
    const files = [...new Set(lists.map(list => list.originalFileName))];
    return files;
  };

  if (loading) {
    return <div className="loading-spinner">Loading lists...</div>;
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Manage Lists</h1>
        <p className="page-subtitle">Upload CSV/XLSX files and distribute among agents</p>
      </div>

      {agents.length === 0 ? (
        <div className="card">
          <div className="alert alert-warning">
            <strong>No agents found!</strong> Please create agents first before uploading files.
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upload File</h3>
          </div>
          
          <div 
            className={`upload-area ${dragOver ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-icon">📁</div>
            <div className="upload-text">
              {selectedFile ? `Selected: ${selectedFile.name}` : 'Drag and drop a file here, or click to select'}
            </div>
            
            <input
              type="file"
              className="file-input"
              id="file-upload"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
            />
            
            <div style={{ marginTop: '20px' }}>
              <label htmlFor="file-upload" className="btn btn-primary" style={{ marginRight: '10px' }}>
                Choose File
              </label>
              {selectedFile && (
                <button
                  className="btn btn-success"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload & Distribute'}
                </button>
              )}
            </div>
            
            <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
              <p><strong>Supported formats:</strong> CSV, XLSX, XLS</p>
              <p><strong>Required columns:</strong> FirstName, Phone, Notes (optional)</p>
              <p><strong>File size limit:</strong> 5MB</p>
            </div>
          </div>
        </div>
      )}

      {lists.length > 0 && (
        <>
          <div className="search-bar">
            <input
              type="text"
              className="form-control search-input"
              placeholder="Search by name, phone, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <select
              className="form-control"
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              style={{ maxWidth: '200px' }}
            >
              <option value="">All Agents</option>
              {agents.map(agent => (
                <option key={agent._id} value={agent._id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Distributed Lists</h3>
              <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
                Total: {filteredLists.length} items
              </p>
            </div>

            {getUniqueFiles().length > 0 && (
              <div style={{ padding: '0 20px 20px 20px' }}>
                <h4 style={{ marginBottom: '15px', fontSize: '16px' }}>Files:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {getUniqueFiles().map(filename => (
                    <div key={filename} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span className="badge badge-info">{filename}</span>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '2px 8px', fontSize: '12px' }}
                        onClick={() => handleDeleteByFile(filename)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>First Name</th>
                    <th>Phone</th>
                    <th>Notes</th>
                    <th>Assigned Agent</th>
                    <th>File Source</th>
                    <th>Upload Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLists.map((list) => (
                    <tr key={list._id}>
                      <td>{list.firstName}</td>
                      <td>{list.phone}</td>
                      <td>{list.notes || '-'}</td>
                      <td>{list.agentId?.name || 'Unknown'}</td>
                      <td>{list.originalFileName}</td>
                      <td>{new Date(list.uploadedAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(list._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLists.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-text">No items found</div>
                <div className="empty-state-subtext">Try adjusting your search or filter criteria</div>
              </div>
            )}
          </div>
        </>
      )}

      {lists.length === 0 && agents.length > 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">No lists uploaded yet</div>
          <div className="empty-state-subtext">Upload your first CSV or Excel file to get started</div>
        </div>
      )}
    </div>
  );
};

export default Lists;
