import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ChangeAdminPassword.css';
import './AdminHistory.css';
import './SecurityLock.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ChangeAdminPassword() {
  const [lockPassword, setLockPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (unlocked) return;

      if (/^[0-9]$/.test(e.key)) {
        setLockPassword((prev) => prev.length < 4 ? prev + e.key : prev);
        setUnlockError('');
      } else if (e.key === 'Backspace') {
        setLockPassword((prev) => prev.slice(0, -1));
        setUnlockError('');
      } else if (e.key === 'Enter') {
        document.getElementById('admin-pass-unlock-btn')?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [unlocked]);

  const verifyUnlock = async () => {
    if (!lockPassword) {
      setUnlockError('Please enter passcode');
      return;
    }

    if (!token) {
      setUnlockError('Admin authentication missing, please login again.');
      return;
    }

    try {
      setUnlockLoading(true);
      setUnlockError('');
      await axios.post(
        `${API_URL}/history/admin`,
        { password: lockPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setUnlocked(true);
      setLockPassword('');
    } catch (error) {
      console.error('Admin pass unlock failed:', error);
      setUnlockError('Incorrect password. Please try again.');
      setLockPassword('');
      setUnlocked(false);
    } finally {
      setUnlockLoading(false);
    }
  };

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
      {!unlocked ? (
        <div className="secure-lock-overlay">
          <div className="secure-lock-card">
            <div className="secure-lock-header">
              <div className="lock-icon-wrapper">
                <i className="fa-solid fa-lock"></i>
              </div>
              <h3>Enter Passcode</h3>
              <p>Unlock the admin password settings with your secure code.</p>
            </div>

            <div className="secure-passcode-display">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`passcode-slot ${i < lockPassword.length ? 'filled' : ''}`}></div>
              ))}
            </div>

            {unlockError && <div className="secure-error-msg">{unlockError}</div>}

            <div className="secure-keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  className="secure-key-btn"
                  onClick={() => { setLockPassword((prev) => prev.length < 4 ? prev + num : prev); setUnlockError(''); }}
                >
                  {num}
                </button>
              ))}
              <button className="secure-key-btn action-btn" onClick={() => { setLockPassword(''); setUnlockError(''); }}>
                C
              </button>
              <button className="secure-key-btn" onClick={() => { setLockPassword((prev) => prev.length < 4 ? prev + '0' : prev); setUnlockError(''); }}>
                0
              </button>
              <button className="secure-key-btn action-btn" onClick={() => { setLockPassword((prev) => prev.slice(0, -1)); setUnlockError(''); }}>
                ⌫
              </button>
            </div>

            <button
              id="admin-pass-unlock-btn"
              className="secure-unlock-btn"
              onClick={verifyUnlock}
              disabled={unlockLoading}
            >
              {unlockLoading ? 'Verifying...' : 'Unlock'}
            </button>
          </div>
        </div>
      ) : (
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
                <li>New password must be different from current password</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
