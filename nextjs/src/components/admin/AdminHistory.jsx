'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminHistory.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const AdminHistory = () => {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    if (unlocked) {
      fetchHistory();
    }
  }, [unlocked, filterType, filterAction]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.post(
        `${API_URL}/history/admin`,
        { password, entityType: filterType || undefined, actionType: filterAction || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistory(res.data.history || []);
    } catch (err) {
      console.error('History fetch failed:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to fetch history');
      setHistory([]);
      setUnlocked(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!password) {
      setError('Please enter history password');
      return;
    }
    setUnlocked(true);
  };

  const formatTimestamp = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const getClientInfo = (info) => {
    if (!info) return '-';
    return [info.platform, info.browserName, info.os, info.language]
      .filter(Boolean)
      .join(' | ');
  };

  return (
    <div className="admin-history-container">
      <div className="history-topbar">
        <div>
          <h2>Admin Change History</h2>
          <p>Only main admin can unlock this view using the secret history password.</p>
        </div>
        {!unlocked && (
          <div className="history-unlock-box">
            <label>Secret Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter history password"
            />
            <button type="button" className="unlock-btn" onClick={handleUnlock}>Unlock</button>
            {error && <p className="history-error">{error}</p>}
          </div>
        )}
      </div>

      {unlocked && (
        <div className="history-content">
          <div className="history-filters">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              <option value="Product">Product</option>
              <option value="Order">Order</option>
              <option value="User">User</option>
            </select>
            <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="status-change">Status Change</option>
              <option value="cancel">Cancel</option>
              <option value="refund">Refund</option>
            </select>
            <button type="button" className="refresh-history-btn" onClick={fetchHistory} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {error && <p className="history-error">{error}</p>}

          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Type</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Changed By</th>
                  <th>Role</th>
                  <th>Client / Device</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="history-empty">No history records found.</td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item._id}>
                      <td>{formatTimestamp(item.createdAt)}</td>
                      <td>{item.entityType}</td>
                      <td>{item.actionType}</td>
                      <td>{item.entityName || item.entityId || '-'}</td>
                      <td>{item.changedByName || item.changedByEmail || item.changedById || 'Unknown'}</td>
                      <td>{item.changedByRole}</td>
                      <td>{getClientInfo(item.clientInfo)}</td>
                      <td>{item.description || JSON.stringify(item.metadata || {})}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHistory;
