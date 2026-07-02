import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CoadminManagement.css';
import './AdminHistory.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function CoadminManagement() {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  const [activeTab, setActiveTab] = useState('username');
  
  // Username form states
  const [newUsername, setNewUsername] = useState('');
  const [confirmUsername, setConfirmUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState('');
  const [usernameMessageType, setUsernameMessageType] = useState('');

  // Password form states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordMessageType, setPasswordMessageType] = useState('');

  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showConfirmAdminPassword, setShowConfirmAdminPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminMessageType, setAdminMessageType] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

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
        document.getElementById('coadmin-unlock-btn')?.click();
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

    if (!token) {
      setUnlockError('Admin authentication missing. Please log in again.');
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
      setPassword('');
      setActiveTab('username');
    } catch (error) {
      console.error('Unlock failed:', error);
      setUnlockError('Incorrect passcode or authentication failed. Please try again.');
      setPassword('');
      setUnlocked(false);
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();

    if (!newUsername || !confirmUsername) {
      setUsernameMessageType('error');
      setUsernameMessage('Both fields are required');
      return;
    }

    if (newUsername.trim().length < 3) {
      setUsernameMessageType('error');
      setUsernameMessage('Username must be at least 3 characters');
      return;
    }

    if (newUsername !== confirmUsername) {
      setUsernameMessageType('error');
      setUsernameMessage('Usernames do not match');
      return;
    }

    if (newUsername.toLowerCase() === 'coadmin') {
      setUsernameMessageType('error');
      setUsernameMessage('Username cannot be "coadmin" (default username)');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setUsernameMessageType('error');
      setUsernameMessage('Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      setUsernameLoading(true);
      const response = await axios.put(
        `${API_URL}/auth/admin/change-coadmin-username`,
        { newUsername },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUsernameMessageType('success');
      setUsernameMessage(response.data.message || `Coadmin username changed to: ${response.data.username}`);
      setNewUsername('');
      setConfirmUsername('');
      setTimeout(() => {
        setUsernameMessage('');
      }, 3000);
    } catch (error) {
      setUsernameMessageType('error');
      setUsernameMessage(
        error.response?.data?.message || 'Failed to change coadmin username'
      );
    } finally {
      setUsernameLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setPasswordMessageType('error');
      setPasswordMessage('Both fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessageType('error');
      setPasswordMessage('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessageType('error');
      setPasswordMessage('Passwords do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      const response = await axios.put(
        `${API_URL}/auth/admin/change-coadmin-password`,
        { newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setPasswordMessageType('success');
      setPasswordMessage(response.data.message || 'Coadmin password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordMessage('');
      }, 3000);
    } catch (error) {
      setPasswordMessageType('error');
      setPasswordMessage(
        error.response?.data?.message || 'Failed to change coadmin password'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();

    if (!newAdminName || !newAdminUsername || !newAdminPassword || !confirmAdminPassword) {
      setAdminMessageType('error');
      setAdminMessage('All fields are required to create a new admin');
      return;
    }

    if (newAdminUsername.trim().length < 3) {
      setAdminMessageType('error');
      setAdminMessage('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newAdminUsername.trim())) {
      setAdminMessageType('error');
      setAdminMessage('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (['admin', 'coadmin'].includes(newAdminUsername.trim().toLowerCase())) {
      setAdminMessageType('error');
      setAdminMessage('Username cannot be reserved keywords');
      return;
    }

    if (newAdminPassword.length < 6) {
      setAdminMessageType('error');
      setAdminMessage('Password must be at least 6 characters');
      return;
    }

    if (newAdminPassword !== confirmAdminPassword) {
      setAdminMessageType('error');
      setAdminMessage('Passwords do not match');
      return;
    }

    try {
      setAdminLoading(true);
      const response = await axios.post(
        `${API_URL}/auth/admin/create-admin`,
        {
          name: newAdminName.trim(),
          username: newAdminUsername.trim(),
          email: newAdminEmail.trim(),
          password: newAdminPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setAdminMessageType('success');
      setAdminMessage(response.data.message || 'Admin user created successfully');
      setNewAdminName('');
      setNewAdminUsername('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
      setTimeout(() => {
        setAdminMessage('');
      }, 4000);
    } catch (error) {
      setAdminMessageType('error');
      setAdminMessage(
        error.response?.data?.message || 'Failed to create admin user'
      );
      console.error('Create admin failed:', error);
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="coadmin-management-container">
      {!unlocked ? (
        <div className="admin-history-container">
          <div className="history-topbar">
            <div>
              <h3>Co-Admin Management Lock</h3>
              <p>Unlock with the same secret history passcode to manage co-admin username and password.</p>
            </div>
          </div>

          <div className="ios-lock-wrapper">
            <p className="ios-lock-title">Enter Passcode</p>
            <div className="passcode-dots">
              {Array.from({ length: Math.max(4, password.length) }).map((_, i) => (
                <div key={i} className={`dot ${i < password.length ? 'filled' : ''}`}></div>
              ))}
            </div>

            {unlockError && <p className="history-error shake">{unlockError}</p>}

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

            <button
              id="coadmin-unlock-btn"
              className="unlock-btn unlock-btn-wide"
              onClick={verifyPassword}
              disabled={unlockLoading}
            >
              {unlockLoading ? 'Verifying...' : 'Unlock'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="page-title">
            <i className="fas fa-user-shield"></i> Co-Admin Management
          </h2>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-btn ${activeTab === 'username' ? 'active' : ''}`}
              onClick={() => setActiveTab('username')}
            >
              <i className="fas fa-user-edit"></i>
              <span>Change Username / ID</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <i className="fas fa-key"></i>
              <span>Change Password</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'create-admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('create-admin')}
            >
              <i className="fas fa-user-plus"></i>
              <span>Create Admin</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            <div className={`tab-pane ${activeTab === 'username' ? 'visible' : 'hidden'}`}>
              <div className="form-card">
                <h3 className="form-title">
                  <i className="fas fa-user-edit"></i> Change Co-Admin Username / ID
                </h3>
                <p className="form-subtitle">
                  Update the login username for co-admin account
                </p>

                {usernameMessage && (
                  <div className={`alert alert-${usernameMessageType}`}>
                    <i className={`fas fa-${usernameMessageType === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
                    {usernameMessage}
                  </div>
                )}

                <form onSubmit={handleUsernameSubmit}>
                  {/* New Username Field */}
                  <div className="form-group">
                    <label htmlFor="newUsername">New Username / ID</label>
                    <div className="input-wrapper">
                      <i className="fas fa-at"></i>
                      <input
                        type="text"
                        id="newUsername"
                        placeholder="Enter new username (min. 3 characters)"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value.trim())}
                        disabled={usernameLoading}
                        required
                      />
                    </div>
                  </div>

                  {/* Confirm Username Field */}
                  <div className="form-group">
                    <label htmlFor="confirmUsername">Confirm Username / ID</label>
                    <div className="input-wrapper">
                      <i className="fas fa-at"></i>
                      <input
                        type="text"
                        id="confirmUsername"
                        placeholder="Confirm new username"
                        value={confirmUsername}
                        onChange={(e) => setConfirmUsername(e.target.value.trim())}
                        disabled={usernameLoading}
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={usernameLoading}
                  >
                    {usernameLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Updating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i> Update Username
                      </>
                    )}
                  </button>
                </form>

                <div className="info-box">
                  <i className="fas fa-info-circle"></i>
                  <div>
                    <p><strong>Username Requirements:</strong></p>
                    <ul>
                      <li>Minimum 3 characters</li>
                      <li>Letters, numbers, and underscores only</li>
                      <li>Usernames must match</li>
                      <li>Cannot use "coadmin" (default username)</li>
                      <li>Co-Admin will need to use new username to login</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className={`tab-pane ${activeTab === 'password' ? 'visible' : 'hidden'}`}>
              <div className="form-card">
                <h3 className="form-title">
                  <i className="fas fa-key"></i> Change Co-Admin Password
                </h3>
                <p className="form-subtitle">
                  Only admin can change the co-admin's password
                </p>

                {passwordMessage && (
                  <div className={`alert alert-${passwordMessageType}`}>
                    <i className={`fas fa-${passwordMessageType === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
                    {passwordMessage}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit}>
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
                        disabled={passwordLoading}
                        required
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={passwordLoading}
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
                        disabled={passwordLoading}
                        required
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={passwordLoading}
                      >
                        <i className={`fas fa-eye${showConfirmPassword ? '' : '-slash'}`}></i>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? (
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
                      <li>This action logs out the co-admin from all sessions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className={`tab-pane ${activeTab === 'create-admin' ? 'visible' : 'hidden'}`}>
              <div className="form-card">
                <h3 className="form-title">
                  <i className="fas fa-user-plus"></i> Create Admin User
                </h3>
                <p className="form-subtitle">
                  Create a new admin account with username and password.
                </p>

                {adminMessage && (
                  <div className={`alert alert-${adminMessageType}`}>
                    <i className={`fas fa-${adminMessageType === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
                    {adminMessage}
                  </div>
                )}

                <form onSubmit={handleCreateAdminSubmit}>
                  <div className="form-group">
                    <label htmlFor="newAdminName">Admin Name</label>
                    <div className="input-wrapper">
                      <i className="fas fa-id-badge"></i>
                      <input
                        type="text"
                        id="newAdminName"
                        placeholder="Enter the admin's display name"
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        disabled={adminLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newAdminUsername">Admin Username / ID</label>
                    <div className="input-wrapper">
                      <i className="fas fa-user"></i>
                      <input
                        type="text"
                        id="newAdminUsername"
                        placeholder="Choose a username (letters, numbers, underscore)"
                        value={newAdminUsername}
                        onChange={(e) => setNewAdminUsername(e.target.value)}
                        disabled={adminLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newAdminEmail">Admin Email (optional)</label>
                    <div className="input-wrapper">
                      <i className="fas fa-envelope"></i>
                      <input
                        type="email"
                        id="newAdminEmail"
                        placeholder="Optional email for login or recovery"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        disabled={adminLoading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newAdminPassword">Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        id="newAdminPassword"
                        placeholder="Enter password (min. 6 characters)"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        disabled={adminLoading}
                        required
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        disabled={adminLoading}
                      >
                        <i className={`fas fa-eye${showAdminPassword ? '' : '-slash'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmAdminPassword">Confirm Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmAdminPassword ? 'text' : 'password'}
                        id="confirmAdminPassword"
                        placeholder="Confirm password"
                        value={confirmAdminPassword}
                        onChange={(e) => setConfirmAdminPassword(e.target.value)}
                        disabled={adminLoading}
                        required
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowConfirmAdminPassword(!showConfirmAdminPassword)}
                        disabled={adminLoading}
                      >
                        <i className={`fas fa-eye${showConfirmAdminPassword ? '' : '-slash'}`}></i>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={adminLoading}
                  >
                    {adminLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Creating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus"></i> Create Admin
                      </>
                    )}
                  </button>
                </form>

                <div className="info-box">
                  <i className="fas fa-info-circle"></i>
                  <div>
                    <p><strong>New Admin Requirements:</strong></p>
                    <ul>
                      <li>Name and username are required</li>
                      <li>Username must be at least 3 characters</li>
                      <li>Letters, numbers, and underscores only</li>
                      <li>Password must be at least 6 characters</li>
                      <li>Email is optional; placeholder email will be assigned if left blank</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
