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

  // Create Admin form states
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
        setPassword((prev) => prev.length < 4 ? prev + e.key : prev);
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
      setUnlockError('Incorrect passcode or auth failed. Please try again.');
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
      setUsernameMessage('Letters, numbers, and underscores only');
      return;
    }

    try {
      setUsernameLoading(true);
      const response = await axios.put(
        `${API_URL}/auth/admin/change-coadmin-username`,
        { newUsername },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsernameMessageType('success');
      setUsernameMessage(response.data.message || `Coadmin username changed to: ${response.data.username}`);
      setNewUsername('');
      setConfirmUsername('');
      setTimeout(() => setUsernameMessage(''), 3000);
    } catch (error) {
      setUsernameMessageType('error');
      setUsernameMessage(error.response?.data?.message || 'Failed to change coadmin username');
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPasswordMessageType('success');
      setPasswordMessage(response.data.message || 'Coadmin password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(''), 3000);
    } catch (error) {
      setPasswordMessageType('error');
      setPasswordMessage(error.response?.data?.message || 'Failed to change coadmin password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const fetchCoadmins = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings/coadmins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching co-admins:', error.response?.data || error.message || error);
      return null;
    }
  };

  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();

    if (!newAdminName || !newAdminUsername || !newAdminPassword || !confirmAdminPassword) {
      setAdminMessageType('error');
      setAdminMessage('All fields are required');
      return;
    }

    if (newAdminUsername.trim().length < 3) {
      setAdminMessageType('error');
      setAdminMessage('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newAdminUsername.trim())) {
      setAdminMessageType('error');
      setAdminMessage('Letters, numbers, and underscores only');
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
      if (!token) {
        setAdminMessageType('error');
        setAdminMessage('Admin authentication missing. Please log in as main admin first.');
        return;
      }

      setAdminLoading(true);
      const response = await axios.post(
        `${API_URL}/auth/admin/create-coadmin`,
        {
          name: newAdminName.trim(),
          username: newAdminUsername.trim(),
          email: newAdminEmail.trim(),
          password: newAdminPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAdminMessageType('success');
      setAdminMessage(response.data.message || 'Co-admin created successfully');
      setNewAdminName('');
      setNewAdminUsername('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
      fetchCoadmins();
      setTimeout(() => setAdminMessage(''), 4000);
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      setAdminMessageType('error');
      setAdminMessage(serverMessage || error.message || 'Failed to create co-admin');
      console.error('Create coadmin failed:', error.response?.data || error.message || error);
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="coadmin-management-container">
      {!unlocked ? (
        <div className="admin-coadmin-container">
          <div className="history-topbar">
            <h3><i className="fas fa-lock" style={{color:'#3b82f6', marginRight:'8px'}}></i> Security Lock</h3>
            <p>Enter passcode to manage settings</p>
          </div>

          <div className="ios-lock-wrapper">
            <div className="passcode-dots">
              {Array.from({ length: Math.max(4, password.length) }).map((_, i) => (
                <div key={i} className={`dot ${i < password.length ? 'filled' : ''}`}></div>
              ))}
            </div>

            {unlockError && <div className="alert alert-error" style={{justifyContent:'center'}}>{unlockError}</div>}

            <div className="keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} className="key-btn" onClick={() => { setPassword((prev) => prev.length < 4 ? prev + num : prev); setUnlockError(''); }}>
                  {num}
                </button>
              ))}
              <button className="key-btn" onClick={() => { setPassword(''); setUnlockError(''); }}>C</button>
              <button className="key-btn" onClick={() => { setPassword((prev) => prev.length < 4 ? prev + '0' : prev); setUnlockError(''); }}>0</button>
              <button className="key-btn" onClick={() => { setPassword((p) => p.slice(0, -1)); setUnlockError(''); }}>⌫</button>
            </div>

            <button id="coadmin-unlock-btn" className="unlock-btn-wide" onClick={verifyPassword} disabled={unlockLoading}>
              {unlockLoading ? <><i className="fas fa-spinner fa-spin"></i> Verifying...</> : 'Unlock'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="page-title">
            <i className="fas fa-user-shield"></i> Management
          </h2>

          <div className="tab-navigation">
            <button className={`tab-btn ${activeTab === 'username' ? 'active' : ''}`} onClick={() => setActiveTab('username')}>
              <i className="fas fa-user-edit"></i> <span>Username</span>
            </button>
            <button className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
              <i className="fas fa-key"></i> <span>Password</span>
            </button>
            <button className={`tab-btn ${activeTab === 'create-admin' ? 'active' : ''}`} onClick={() => setActiveTab('create-admin')}>
              <i className="fas fa-user-plus"></i> <span>Add Co-Admin</span>
            </button>
          </div>

          <div className="tab-content">
            {/* Username Tab */}
            <div className={`tab-pane ${activeTab === 'username' ? 'visible' : ''}`}>
              <div className="form-card">
                <h3 className="form-title-coadmin"><i className="fas fa-user-edit"></i> Change Username</h3>
                <p className="form-subtitle">Update login ID for co-admin account.</p>

                {usernameMessage && (
                  <div className={`alert alert-${usernameMessageType}`}>
                    <i className={`fas fa-${usernameMessageType === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
                    {usernameMessage}
                  </div>
                )}

                <form onSubmit={handleUsernameSubmit}>
                  <div className="form-group">
                    <label>New Username</label>
                    <div className="input-wrapper">
                      <input type="text" placeholder="Enter new username" value={newUsername} onChange={(e) => setNewUsername(e.target.value.trim())} disabled={usernameLoading} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Confirm Username</label>
                    <div className="input-wrapper">
                      <input type="text" placeholder="Confirm username" value={confirmUsername} onChange={(e) => setConfirmUsername(e.target.value.trim())} disabled={usernameLoading} required />
                    </div>
                  </div>

                  <button type="submit" className="btn-submit" disabled={usernameLoading}>
                    {usernameLoading ? <><i className="fas fa-spinner fa-spin"></i> Updating...</> : <><i className="fas fa-save"></i> Update</>}
                  </button>
                </form>

                <div className="info-box">
                  <i className="fas fa-info-circle"></i>
                  <div>
                    <p>Rules:</p>
                    <ul>
                      <li>Min 3 characters, matching fields.</li>
                      <li>Letters, numbers & underscores only.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Tab */}
            <div className={`tab-pane ${activeTab === 'password' ? 'visible' : ''}`}>
              <div className="form-card">
                <h3 className="form-title-coadmin"><i className="fas fa-key"></i> Change Password</h3>
                <p className="form-subtitle">Update co-admin access password.</p>

                {passwordMessage && (
                  <div className={`alert alert-${passwordMessageType}`}>
                    <i className={`fas fa-${passwordMessageType === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
                    {passwordMessage}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label>New Password</label>
                    <div className="password-input-wrapper">
                      <input type={showPassword ? 'text' : 'password'} placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={passwordLoading} required />
                      <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)} disabled={passwordLoading}>
                        <i className={`fas fa-eye${showPassword ? '' : '-slash'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Confirm Password</label>
                    <div className="password-input-wrapper">
                      <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={passwordLoading} required />
                      <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={passwordLoading}>
                        <i className={`fas fa-eye${showConfirmPassword ? '' : '-slash'}`}></i>
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn-submit" disabled={passwordLoading}>
                    {passwordLoading ? <><i className="fas fa-spinner fa-spin"></i> Changing...</> : <><i className="fas fa-save"></i> Save</>}
                  </button>
                </form>
              </div>
            </div>

            {/* Create Admin Tab */}
            <div className={`tab-pane ${activeTab === 'create-admin' ? 'visible' : ''}`}>
              <div className="form-card">
                <h3 className="form-title-coadmin"><i className="fas fa-user-plus"></i> Add Co-Admin</h3>
                <p className="form-subtitle">Create a new co-admin account with limited access.</p>

                {adminMessage && (
                  <div className={`alert alert-${adminMessageType}`}>
                    <i className={`fas fa-${adminMessageType === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
                    {adminMessage}
                  </div>
                )}

                <form onSubmit={handleCreateAdminSubmit}>
                  <div className="form-group">
                    <label>Display Name</label>
                    <div className="input-wrapper">
                      <input type="text" placeholder="Enter name" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} disabled={adminLoading} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Username</label>
                    <div className="input-wrapper">
                      <input type="text" placeholder="Choose username" value={newAdminUsername} onChange={(e) => setNewAdminUsername(e.target.value)} disabled={adminLoading} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email (Optional)</label>
                    <div className="input-wrapper">
                      <input type="email" placeholder="Email address" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} disabled={adminLoading} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <div className="password-input-wrapper">
                      <input type={showAdminPassword ? 'text' : 'password'} placeholder="Password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} disabled={adminLoading} required />
                      <button type="button" className="toggle-password" onClick={() => setShowAdminPassword(!showAdminPassword)} disabled={adminLoading}>
                        <i className={`fas fa-eye${showAdminPassword ? '' : '-slash'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Confirm Password</label>
                    <div className="password-input-wrapper">
                      <input type={showConfirmAdminPassword ? 'text' : 'password'} placeholder="Confirm password" value={confirmAdminPassword} onChange={(e) => setConfirmAdminPassword(e.target.value)} disabled={adminLoading} required />
                      <button type="button" className="toggle-password" onClick={() => setShowConfirmAdminPassword(!showConfirmAdminPassword)} disabled={adminLoading}>
                        <i className={`fas fa-eye${showConfirmAdminPassword ? '' : '-slash'}`}></i>
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn-submit" disabled={adminLoading}>
                    {adminLoading ? <><i className="fas fa-spinner fa-spin"></i> Creating...</> : <><i className="fas fa-plus"></i> Create</>}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}