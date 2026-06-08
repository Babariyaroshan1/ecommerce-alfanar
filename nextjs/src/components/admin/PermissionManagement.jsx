'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PermissionManagement.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production

const AVAILABLE_PERMISSIONS = [
  {
    key: 'manage_products',
    label: 'Manage Products',
    description: 'Add, edit, and delete products',
    icon: 'fa-box'
  },
  {
    key: 'manage_kids_products',
    label: 'Manage Kids Products',
    description: 'Add, edit, and delete kids products',
    icon: 'fa-child'
  },
  {
    key: 'manage_orders',
    label: 'Manage Orders',
    description: 'View and update order status',
    icon: 'fa-shopping-cart'
  },
  {
    key: 'manage_users',
    label: 'Manage Users',
    description: 'View user information',
    icon: 'fa-users'
  },
  {
    key: 'view_analytics',
    label: 'View Analytics',
    description: 'Access sales and performance data',
    icon: 'fa-chart-bar'
  }, 
  {
    key: 'manage_content',
    label: 'Manage Content',
    description: 'Edit website content and banners',
    icon: 'fa-edit'
  },
  {
    key: 'manage_faqs',
    label: 'Manage FAQs',
    description: 'Add, edit, and delete FAQ entries',
    icon: 'fa-question-circle'
  },
  {
    key: 'manage_product_faqs',
    label: 'Manage Product FAQs',
    description: 'Add, edit, and delete product-specific FAQs',
    icon: 'fa-question-circle'
  },
  {
    key: 'manage_reviews',
    label: 'Manage Reviews',
    description: 'View and manage product reviews',
    icon: 'fa-star'
  },
  {
    key: 'manage_banner',
    label: 'Manage Banner',
    description: 'Update website banner and images',
    icon: 'fa-image'
  },
  {
    key: 'manage_currency',
    label: 'Manage Currency',
    description: 'Configure currency settings and rates',
    icon: 'fa-dollar-sign'
  },
  {
    key: 'manage_coupons',
    label: 'Manage Coupons',
    description: 'Create and manage discount coupons',
    icon: 'fa-tags'
  },
  {
    key: 'manage_settings',
    label: 'Manage Settings',
    description: 'Manage system settings and permissions',
    icon: 'fa-cog'
  }
];

export default function PermissionManagement() {
  const [coadmins, setCoadmins] = useState([]);
  const [selectedCoadmin, setSelectedCoadmin] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    fetchCoadmins();
  }, []);

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
      setSelectedCoadmin(prev => ({
        ...prev,
        permissions: selectedPermissions
      }));

      setCoadmins(prev => prev.map(coadmin =>
        coadmin._id === selectedCoadmin._id
          ? { ...coadmin, permissions: selectedPermissions }
          : coadmin
      ));

      setMessage('✅ Permissions updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Failed to update permissions. Please try again.');
      console.error('Error updating permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="permission-management">
      <div className="permission-header">
        <h2>Permission Management</h2>
        <p>Control what features co-admins can access. Only main admin can modify permissions.</p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="permission-content">
        <div className="coadmin-list">
          <h3>Co-Admins</h3>
          {coadmins.length === 0 ? (
            <p className="no-coadmins">No co-admins found. Create co-admin accounts first.</p>
          ) : (
            <div className="coadmin-grid">
              {coadmins.map(coadmin => (
                <div
                  key={coadmin._id}
                  className={`coadmin-card ${selectedCoadmin?._id === coadmin._id ? 'selected' : ''}`}
                  onClick={() => handleCoadminSelect(coadmin)}
                >
                  <div className="coadmin-info">
                    <h4>{coadmin.name}</h4>
                    <p>{coadmin.email}</p>
                    <span className="permission-count">
                      {coadmin.permissions?.length || 0} permissions granted
                    </span>
                  </div>
                  <div className="selection-indicator">
                    {selectedCoadmin?._id === coadmin._id && <i className="fa-solid fa-check"></i>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedCoadmin && (
          <div className="permission-editor">
            <h3>Edit Permissions for {selectedCoadmin.name}</h3>

            <div className="permissions-list">
              {AVAILABLE_PERMISSIONS.map(permission => (
                <div key={permission.key} className="permission-item">
                  <div className="permission-info">
                    <div className="permission-header">
                      <i className={`fa-solid ${permission.icon}`}></i>
                      <h4>{permission.label}</h4>
                    </div>
                    <p>{permission.description}</p>
                  </div>
                  <label className="permission-toggle">
                    <input
                      type="checkbox"
                      checked={permissions[permission.key] || false}
                      onChange={() => handlePermissionToggle(permission.key)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              ))}
            </div>

            <div className="permission-actions">
              <button
                onClick={handleSavePermissions}
                disabled={loading}
                className="save-btn"
              >
                {loading ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}