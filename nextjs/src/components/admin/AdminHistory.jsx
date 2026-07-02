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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

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
      setPage(1);
    }
  }, [filterType, filterAction, unlocked]);

  useEffect(() => {
    if (unlocked) {
      fetchHistory(page, pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filterType, filterAction, unlocked]);

  const fetchHistory = async (requestedPage = 1, requestedPageSize = pageSize) => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.post(
        `${API_URL}/history/admin`,
        {
          password,
          entityType: filterType || undefined,
          actionType: filterAction || undefined,
          page: requestedPage,
          pageSize: requestedPageSize
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHistory(res.data.history || []);
      setPage(res.data.page || requestedPage);
      setPageSize(res.data.pageSize || requestedPageSize);
      setTotalRecords(res.data.totalRecords ?? (res.data.history || []).length);
      setTotalPages(res.data.totalPages || 1);
      setUnlocked(true);
    } catch (err) {
      console.error('History fetch failed:', err);
      setError('Incorrect password! Please try again.');
      setPassword('');
      setUnlocked(false);
    } finally {
      setLoading(false);
    }
  };

  // Main API Call (Check Password & Fetch Data)
  const verifyAndFetch = async () => {
    if (!password) {
      setError('Please enter passcode');
      return;
    }

    await fetchHistory(1, pageSize);
  };

  const formatTimestamp = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const getClientInfo = (info) => {
    if (!info) return '-';
    const browser = info.browserName || info.vendor || '';
    const platform = info.platform || info.os || '';
    const memory = info.deviceMemory ? `${info.deviceMemory}GB` : '';
    const language = info.language || '';
    const userAgent = info.userAgent || '';
    const parts = [browser, platform, memory, language].filter(Boolean);
    if (parts.length > 0) return parts.join(' | ');
    if (userAgent) return userAgent;
    return '-';
  };

  const getVisiblePageNumbers = () => {
    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
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
          <h3 className="ad-his-main">Admin Change History</h3>
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
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
              <option value={10}>Show 10</option>
              <option value={20}>Show 20</option>
              <option value={50}>Show 50</option>
            </select>
            <button type="button" className="refresh-history-btn" onClick={verifyAndFetch} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {error && <p className="history-error">{error}</p>}

          <div className="history-summary">
            <span>{`Showing ${history.length} records of ${totalRecords}`}</span>
          </div>

          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>#</th>
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
                    <td colSpan="9" className="history-empty">No history records found.</td>
                  </tr>
                ) : (
                  history.map((item, index) => (
                    <tr key={item._id || index} className={index % 2 === 0 ? 'history-row-even' : 'history-row-odd'}>
                      <td>{(page - 1) * pageSize + index + 1}</td>
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

          <div className="history-pagination">
            <div className="pagination-info">
              Page {page} of {totalPages}
            </div>
            <div className="pagination-buttons">
              <button
                type="button"
                className="page-button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`page-button ${pageNumber === page ? 'active' : ''}`}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                className="page-button"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                First
              </button>
              {getVisiblePageNumbers().map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`page-button ${pageNumber === page ? 'active' : ''}`}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                className="page-button"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHistory;