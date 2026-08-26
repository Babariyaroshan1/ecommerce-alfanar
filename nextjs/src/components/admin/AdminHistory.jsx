

'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
// Only import your main CSS here
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

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (unlocked) return;

      if (/^[0-9]$/.test(e.key)) {
        setPassword((prev) => prev.length < 4 ? prev + e.key : prev);
        setError('');
      } else if (e.key === 'Backspace') {
        setPassword((prev) => prev.slice(0, -1));
        setError('');
      } else if (e.key === 'Enter') {
        document.getElementById('ah-unlock-btn')?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [unlocked]);

  // Fetch logic dependency fixed
  useEffect(() => {
    if (unlocked) {
      fetchHistory(page, pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, filterType, filterAction]); 

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
          pageSize: requestedPageSize,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const historyData = res.data.history || [];
      const totalRecs = res.data.totalRecords ?? historyData.length;
      const calculatedPages = res.data.totalPages || Math.ceil(totalRecs / requestedPageSize) || 1;

      setHistory(historyData);
      
      setPage(Number(res.data.page || requestedPage));
      setPageSize(Number(res.data.pageSize || requestedPageSize));
      setTotalRecords(Number(totalRecs));
      setTotalPages(Number(calculatedPages));
      
      setUnlocked(true);
    } catch (err) {
      console.error('History fetch failed:', err);
      setError('Incorrect passcode! Please try again.');
      setPassword('');
      setUnlocked(false);
    } finally {
      setLoading(false);
    }
  };

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

  // EXTRACT DEVICE NAME IF AVAILABLE, OTHERWISE FALLBACK TO OS/BROWSER
  const getClientInfo = (info) => {
    if (!info) return '-';
    
    // Check if the backend specifically logged the machine's "deviceName" (e.g., DESKTOP-26LKEN7)
    // If it exists in the database's clientInfo object, print it!
    if (info.deviceName) return info.deviceName;
    if (info.hostname) return info.hostname;

    // Fallback parsing from userAgent string if native Device Name isn't passed from backend
    const ua = info.userAgent || '';
    
    if (!ua) {
      const browser = info.browserName || info.vendor || '';
      const platform = info.platform || info.os || '';
      return browser || platform ? `${browser} | ${platform}` : '-';
    }

    let browser = "Unknown Browser";
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";

    let os = "Unknown OS";
    if (ua.includes("Windows NT 10.0") || ua.includes("Windows NT 11.0")) os = "Windows 10/11";
    else if (ua.includes("Windows NT 6.")) os = "Windows 7/8";
    else if (ua.includes("Mac OS X")) os = "Mac OS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    return `${browser} on ${os}`;
  };

  const getVisiblePageNumbers = () => {
    if (totalPages <= 1) return [1];
    
    const maxButtons = 5;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    
    start = Math.max(1, start);
    
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, idx) => start + idx);
  };

  const handleKeypadClick = (val) => {
    if (loading) return;
    setPassword((prev) => prev.length < 4 ? prev + val : prev);
    setError('');
  };

  return (
    <>
      {!unlocked ? (
        // LOCK SCREEN - Shown BEFORE unlock
        <div className="secure-lock-overlay">
          <div className="secure-lock-card">
            <div className="secure-lock-header">
              <div className="lock-icon-wrapper">
                <i className="fa-solid fa-lock"></i>
              </div>
              <h3>Admin Authorization</h3>
              <p>Enter history passcode to continue</p>
            </div>

            {error && <div className="secure-error-msg">{error}</div>}

            <div className="secure-passcode-display">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`passcode-slot ${i < password.length ? 'filled' : ''}`}></div>
              ))}
            </div>

            <div className="secure-keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} className="secure-key-btn" onClick={() => handleKeypadClick(num)}>
                  {num}
                </button>
              ))}
              <button className="secure-key-btn action-btn" onClick={() => { setPassword(''); setError(''); }}>
                C
              </button>
              <button className="secure-key-btn" onClick={() => handleKeypadClick('0')}>
                0
              </button>
              <button className="secure-key-btn action-btn" onClick={() => { setPassword((p) => p.slice(0, -1)); setError(''); }}>
                ⌫
              </button>
            </div>

            <button id="ah-unlock-btn" className="secure-unlock-btn" onClick={verifyAndFetch} disabled={loading || password.length !== 4}>
              {loading ? <><i className="fas fa-circle-notch fa-spin"></i> Verifying...</> : 'Unlock History'}
            </button>
          </div>
        </div>
      ) : (
        // MAIN CONTENT - Shown AFTER unlock
        <div className="ah-container">
          <div className="ah-header">
            <div>
              <h3>Admin Change History</h3>
              <p>Only main admin can view this system history log.</p>
            </div>
          </div>

          <div className="ah-dashboard">
            <div className="ah-filters-bar">
              <select className="ah-select" value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
                <option value="">All Types</option>
                <option value="Product">Product</option>
                <option value="Order">Order</option>
                <option value="User">User</option>
              </select>
              <select className="ah-select" value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}>
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="status-change">Status Change</option>
                <option value="cancel">Cancel</option>
                <option value="refund">Refund</option>
              </select>
              <select className="ah-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                <option value={10}>Show 10</option>
                <option value={20}>Show 20</option>
                <option value={50}>Show 50</option>
              </select>
              <button type="button" className="ah-btn-refresh" onClick={verifyAndFetch} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh History'}
              </button>
            </div>

            <div className="ah-summary-text">
              <span>{`Showing ${history.length} records of ${totalRecords}`}</span>
            </div>

            <div className="ah-table-wrapper">
              <table className="ah-table">
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
                      <td colSpan="9" className="ah-empty-state">No history records found.</td>
                    </tr>
                  ) : (
                    history.map((item, index) => (
                      <tr key={item._id || index}>
                        <td className="numeric-value">{(page - 1) * pageSize + index + 1}</td>
                        <td>{formatTimestamp(item.createdAt)}</td>
                        <td><span className="badge-type">{item.entityType}</span></td>
                        <td><span className={`badge-action action-${item.actionType?.toLowerCase()}`}>{item.actionType}</span></td>
                        <td>{item.entityName || item.entityId || '-'}</td>
                        <td>{item.changedByName || item.changedByEmail || item.changedById || 'Unknown'}</td>
                        <td>{item.changedByRole}</td>
                        <td>{getClientInfo(item.clientInfo)}</td>
                        <td className="desc-column">{item.description || JSON.stringify(item.metadata || {})}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="ah-pagination-bar">
              <div className="ah-page-info">Page <span className="numeric-value">{page}</span> of <span className="numeric-value">{totalPages}</span></div>
              <div className="ah-page-buttons">
                <button type="button" className="ah-page-btn" onClick={() => setPage(1)} disabled={page === 1}>First</button>
                <button type="button" className="ah-page-btn" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>Prev</button>
                {getVisiblePageNumbers().map((pageNumber) => (
                  <button key={pageNumber} type="button" className={`ah-page-btn ${pageNumber === page ? 'active' : ''}`} onClick={() => setPage(pageNumber)}><span className="numeric-value">{pageNumber}</span></button>
                ))}
                <button type="button" className="ah-page-btn" onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={page === totalPages}>Next</button>
                <button type="button" className="ah-page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminHistory;




