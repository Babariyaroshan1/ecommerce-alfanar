import React, { useState } from 'react';
import axios from 'axios';
import './ChangeCoadminPassword.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ChangeCoadminPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setMessageType('error');
      setMessage('Both fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setMessageType('error');
      setMessage('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessageType('error');
      setMessage('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const response = await axios.put(
        `${API_URL}/auth/admin/change-coadmin-password`,
        { newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessageType('success');
      setMessage(response.data.message || 'Coadmin password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      setMessageType('error');
      setMessage(
        error.response?.data?.message || 'Failed to change coadmin password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-coadmin-password-container">
      <div className="password-form-card">
        <h2 className="form-title">
          <i className="fas fa-key"></i> Change Coadmin Password
        </h2>
        <p className="form-subtitle">
          Only admin can change the coadmin's password
        </p>

        {message && (
          <div className={`alert alert-${messageType}`}>
            <i className={`fas fa-${messageType === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* New Password Field */}
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
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
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <i className={`fas fa-eye${showPassword ? '' : '-slash'}`}></i>
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
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
              <li>Minimum 6 characters</li>
              <li>Passwords must match</li>
              <li>This action logs out the coadmin from all sessions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
