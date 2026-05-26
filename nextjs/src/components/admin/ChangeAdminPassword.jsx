import React, { useState } from 'react';
import axios from 'axios';
import './ChangeAdminPassword.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ChangeAdminPassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessageType('error');
      setMessage('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setMessageType('error');
      setMessage('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessageType('error');
      setMessage('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setMessageType('error');
      setMessage('New password must be different from current password');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const response = await axios.put(
        `${API_URL}/auth/admin/change-admin-password`,
        { currentPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessageType('success');
      setMessage(response.data.message || 'Admin password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      setMessageType('error');
      setMessage(
        error.response?.data?.message || 'Failed to change admin password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-admin-password-container">
      <div className="password-form-card">
        <h2 className="form-title">
          <i className="fas fa-lock"></i> Change Admin Password
        </h2>
        <p className="form-subtitle">
          Update your admin account password
        </p>

        {message && (
          <div className={`alert alert-${messageType}`}>
            <i className={`fas fa-${messageType === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Current Password Field */}
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <div className="password-input-wrapper">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                id="currentPassword"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={loading}
              >
                <i className={`fas fa-eye${showCurrentPassword ? '' : '-slash'}`}></i>
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={loading}
              >
                <i className={`fas fa-eye${showNewPassword ? '' : '-slash'}`}></i>
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                <i className={`fas fa-eye${showConfirmPassword ? '' : '-slash'}`}></i>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Changing...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i> Change Password
              </>
            )}
          </button>
        </form>

        <div className="info-box">
          <i className="fas fa-info-circle"></i>
          <div>
            <p><strong>Password Requirements:</strong></p>
            <ul>
              <li>Current password must be correct</li>
              <li>Minimum 6 characters</li>
              <li>Passwords must match</li>
              <li>New password must be different from current</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
