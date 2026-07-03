'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PermissionManagement.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const AVAILABLE_PERMISSIONS = [
  { key: 'view_products', label: 'View Products', description: 'View product listings and details only', icon: 'fa-eye' },
  { key: 'add_products', label: 'Add Products', description: 'Create new products', icon: 'fa-plus' },
  { key: 'edit_products', label: 'Edit Products', description: 'Modify existing products', icon: 'fa-edit' },
  { key: 'delete_products', label: 'Delete Products', description: 'Remove products from database', icon: 'fa-trash' },
  { key: 'manage_kids_products', label: 'Manage Kids', description: 'Add, edit, and delete kids products', icon: 'fa-child' },
  { key: 'manage_orders', label: 'Manage Orders', description: 'View and update order status', icon: 'fa-shopping-cart' },
  { key: 'manage_users', label: 'Manage Users', description: 'View user information', icon: 'fa-users' },
  { key: 'view_analytics', label: 'View Analytics', description: 'Access sales and performance data', icon: 'fa-chart-bar' },
  { key: 'manage_content', label: 'Manage Content', description: 'Edit website content and banners', icon: 'fa-file-alt' },
  { key: 'manage_faqs', label: 'Manage FAQs', description: 'Add, edit, and delete FAQ entries', icon: 'fa-question-circle' },
  { key: 'manage_product_faqs', label: 'Manage Product FAQs', description: 'Add, edit, and delete product-specific FAQs', icon: 'fa-question-circle' },
  { key: 'manage_reviews', label: 'Manage Reviews', description: 'View and manage product reviews', icon: 'fa-star' },
  { key: 'manage_banner', label: 'Manage Banner', description: 'Update website banner and images', icon: 'fa-image' },
  { key: 'manage_currency', label: 'Manage Currency', description: 'Configure currency settings and rates', icon: 'fa-dollar-sign' },
  { key: 'manage_coupons', label: 'Manage Coupons', description: 'Create and manage discount coupons', icon: 'fa-tags' },
  { key: 'manage_settings', label: 'Manage Settings', description: 'Manage system settings and permissions', icon: 'fa-cog' }
];

export default function PermissionManagement() {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  const [coadmins, setCoadmins] = useState([]);
  const [selectedCoadmin, setSelectedCoadmin] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    if (unlocked) {
      fetchCoadmins();
    }
  }, [unlocked]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (unlocked) return;

      if (/^[0-9]$/.test(e.key)) {
        setPassword((prev) => prev + e.key);
        setUnlockError('');
      } else if (e.key === 'Backspace') {
        setPassword((prev) => prev.slice(0, -1));
        setUnlockError('');
      } else if (e.key === 'Enter') {
        document.getElementById('permission-unlock-btn')?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [unlocked]);

  const verifyPassword = async () => {
    if (!password) {
      setUnlockError('Please enter passcode');
      return;
    }

    try {
      setUnlockLoading(true);
      setUnlockError('');
      await axios.post(
        `${API_URL}/history/admin`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnlocked(true);
    } catch (error) {
      console.error('Permission unlock failed:', error);
      setUnlockError('Incorrect password! Please try again.');
      setPassword('');
      setUnlocked(false);
    } finally {
      setUnlockLoading(false);
    }
  };

  const fetchCoadmins = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings/coadmins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoadmins(response.data);
    } catch (error) {
      console.error('Error fetching co-admins:', error);
    }
  };

  const handleCoadminSelect = (coadmin) => {
    setSelectedCoadmin(coadmin);
    setPermissions(
      AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
        acc[perm.key] = coadmin.permissions?.includes(perm.key) || false;
        return acc;
      }, {})
    );
  };

  const handlePermissionToggle = (permissionKey) => {
    setPermissions(prev => ({
      ...prev,
      [permissionKey]: !prev[permissionKey]
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedCoadmin) return;

    setLoading(true);
    setMessage('');

    const selectedPermissions = Object.keys(permissions).filter(key => permissions[key]);

    try {
      await axios.put(`${API_URL}/settings/coadmin-permissions`, {
        coadminId: selectedCoadmin._id,
        permissions: selectedPermissions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setSelectedCoadmin(prev => ({ ...prev, permissions: selectedPermissions }));
      setCoadmins(prev => prev.map(coadmin =>
        coadmin._id === selectedCoadmin._id
          ? { ...coadmin, permissions: selectedPermissions }
          : coadmin
      ));

      setMessage('[SUCCESS] Permissions updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('[ERROR] Failed to update permissions. Please try again.');
      console.error('Error updating permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract initials
  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="permission-management">
      {!unlocked ? (
        <div className="admin-coadmin-container">
          <div className="lock-header-text">
            <h3>Admin Security Lock</h3>
            <p>Enter your master passcode to access permission controls.</p>
          </div>

          <div className="ios-lock-wrapper">
            <p className="ios-lock-title">Enter Passcode</p>
            <div className="passcode-dots">
              {Array.from({ length: Math.max(4, password.length) }).map((_, i) => (
                <div key={i} className={`dot ${i < password.length ? 'filled' : ''}`}></div>
              ))}
            </div>

            {unlockError && <div className="history-error shake">{unlockError}</div>}

            <div className="keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} className="key-btn" onClick={() => { setPassword((prev) => prev + num); setUnlockError(''); }}>
                  {num}
                </button>
              ))}
              <button className="key-btn action-btn" onClick={() => { setPassword(''); setUnlockError(''); }}>
                C
              </button>
              <button className="key-btn" onClick={() => { setPassword((prev) => prev + '0'); setUnlockError(''); }}>
                0
              </button>
              <button className="key-btn action-btn" onClick={() => { setPassword((p) => p.slice(0, -1)); setUnlockError(''); }}>
                ⌫
              </button>
            </div>

            <button id="permission-unlock-btn" className="unlock-btn-wide" onClick={verifyPassword} disabled={unlockLoading}>
              {unlockLoading ? 'Verifying...' : 'Unlock Permissions'}
            </button>
          </div>
        </div>
      ) : (
        <div className="permission-dashboard">
          <div className="permission-header-main">
            <h2>Permission Control</h2>
            <p>Manage access levels and capabilities for your co-administrators.</p>
          </div>

          {message && (
            <div className={`modern-message ${message.includes('[SUCCESS]') ? 'success' : 'error'}`}>
              <i className={`fa-solid ${message.includes('[SUCCESS]') ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              {message.replace('[SUCCESS]', '').replace('[ERROR]', '')}
            </div>
          )}

          <div className="permission-layout-grid">
            {/* Sidebar List */}
            <div className="coadmin-sidebar">
              <h3>Select Co-Admin</h3>
              <div className="coadmin-list-scroll">
                {coadmins.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No co-admins found.</p>
                ) : (
                  coadmins.map(coadmin => (
                    <div
                      key={coadmin._id}
                      className={`coadmin-card-modern ${selectedCoadmin?._id === coadmin._id ? 'selected' : ''}`}
                      onClick={() => handleCoadminSelect(coadmin)}
                    >
                      <div className="coadmin-avatar">
                        {getInitials(coadmin.name)}
                      </div>
                      <div className="coadmin-details">
                        <h4>{coadmin.name}</h4>
                        <p>{coadmin.permissions?.length || 0} permissions</p>
                      </div>
                      {selectedCoadmin?._id === coadmin._id && (
                        <i className="fa-solid fa-chevron-right" style={{ color: '#3b82f6' }}></i>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Main Area Edit */}
            <div className="permission-main-panel">
              {selectedCoadmin ? (
                <>
                  <div className="permission-panel-header">
                    <div>
                      <h3>Editing: {selectedCoadmin.name}</h3>
                      <p style={{ margin: '4px 0 0', color: '#a1a1aa', fontSize: '0.9rem' }}>{selectedCoadmin.email}</p>
                    </div>
                    <button onClick={handleSavePermissions} disabled={loading} className="save-btn-modern">
                      <i className="fa-solid fa-save"></i>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>

                  <div className="permissions-grid">
                    {AVAILABLE_PERMISSIONS.map(permission => {
                      const isActive = permissions[permission.key];
                      return (
                        <div key={permission.key} className={`perm-card ${isActive ? 'active' : ''}`}>
                          <div className="perm-card-top">
                            <div className="perm-icon-wrapper">
                              <i className={`fa-solid ${permission.icon}`}></i>
                            </div>
                            <label className="premium-toggle">
                              <input
                                type="checkbox"
                                checked={isActive || false}
                                onChange={() => handlePermissionToggle(permission.key)}
                              />
                              <span className="toggle-track"></span>
                            </label>
                          </div>
                          <div className="perm-info">
                            <h4>{permission.label}</h4>
                            <p>{permission.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#71717a' }}>
                  <i className="fa-solid fa-user-shield" style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}></i>
                  <h3>No Admin Selected</h3>
                  <p>Select a co-admin from the sidebar to manage their permissions.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}