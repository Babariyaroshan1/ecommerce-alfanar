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

  // Keyboard Event Listener (For typing via Physical Keyboard)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (unlocked) return; // Agar unlock ho chuka hai toh keyboard type na kare

      if (/^[0-9]$/.test(e.key)) {
        setPassword((prev) => prev + e.key);
        setError(''); // Type karte hi error hata do
      } else if (e.key === 'Backspace') {
        setPassword((prev) => prev.slice(0, -1));
        setError('');
      } else if (e.key === 'Enter') {
        document.getElementById('unlock-btn')?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [unlocked]);

  // Filters change hone par list refresh karega (Only if Unlocked)
  useEffect(() => {
    if (unlocked) {
      verifyAndFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterAction]);

  // Main API Call (Check Password & Fetch Data)
  const verifyAndFetch = async () => {
    if (!password) {
      setError('Please enter passcode');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await axios.post(
        `${API_URL}/history/admin`,
        { password, entityType: filterType || undefined, actionType: filterAction || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Agar password sahi hai:
      setHistory(res.data.history || []);
      setUnlocked(true);
    } catch (err) {
      console.error('History fetch failed:', err);
      // Agar password galat hai (Error Handle):
      setError('Incorrect password! Please try again.');
      setPassword(''); // Password auto clear kardo
      setUnlocked(false);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const getClientInfo = (info) => {
    if (!info) return '-';
    return [info.platform, info.browserName, info.os, info.language].filter(Boolean).join(' | ');
  };

  // On-Screen Keypad Handler
  const handleKeypadClick = (val) => {
    if (loading) return;
    setPassword((prev) => prev + val);
    setError('');
  };

  return (
    <div className="admin-history-container">
      <div className="history-topbar">
        <div>
          <h2>Admin Change History</h2>
          <p>Only main admin can unlock this view using the secret history password.</p>
        </div>
      </div>

      {!unlocked ? (
        <div className="ios-lock-wrapper">
          <p className="ios-lock-title">Enter Passcode</p>
          
          {/* Dots Indicator */}
          <div className="passcode-dots">
            {/* Hamesha minimum 4 dots dikhayega, jaise jaise type hoga fill hoga */}
            {Array.from({ length: Math.max(4, password.length) }).map((_, i) => (
              <div key={i} className={`dot ${i < password.length ? 'filled' : ''}`}></div>
            ))}
          </div>

          {/* Error Message with Shake Animation */}
          {error && <p className="history-error shake">{error}</p>}

          {/* iOS Style Number Pad */}
          <div className="keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button key={num} className="key-btn" onClick={() => handleKeypadClick(num)}>
                {num}
              </button>
            ))}
            <button className="key-btn action-btn" onClick={() => { setPassword(''); setError(''); }}>
              C
            </button>
            <button className="key-btn" onClick={() => handleKeypadClick('0')}>
              0
            </button>
            <button className="key-btn action-btn" onClick={() => { setPassword((p) => p.slice(0, -1)); setError(''); }}>
              ⌫
            </button>
          </div>

          <button id="unlock-btn" className="unlock-btn unlock-btn-wide" onClick={verifyAndFetch} disabled={loading}>
            {loading ? 'Verifying...' : 'Unlock'}
          </button>
        </div>
      ) : (
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
            <button type="button" className="refresh-history-btn" onClick={verifyAndFetch} disabled={loading}>
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