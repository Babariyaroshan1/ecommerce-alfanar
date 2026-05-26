import React, { useState } from 'react';
import axios from 'axios';
import './ChangeCoadminUsername.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ChangeCoadminUsername() {
  const [newUsername, setNewUsername] = useState('');
  const [confirmUsername, setConfirmUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newUsername || !confirmUsername) {
      setMessageType('error');
      setMessage('Both fields are required');
      return;
    }

    if (newUsername.trim().length < 3) {
      setMessageType('error');
      setMessage('Username must be at least 3 characters');
      return;
    }

    if (newUsername !== confirmUsername) {
      setMessageType('error');
      setMessage('Usernames do not match');
      return;
    }

    if (newUsername.toLowerCase() === 'coadmin') {
      setMessageType('error');
      setMessage('Username cannot be "coadmin" (default username)');
      return;
    }

    // Check if username contains only alphanumeric characters and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setMessageType('error');
      setMessage('Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const response = await axios.put(
        `${API_URL}/auth/admin/change-coadmin-username`,
        { newUsername },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessageType('success');
      setMessage(response.data.message || `Coadmin username changed to: ${response.data.username}`);
      setNewUsername('');
      setConfirmUsername('');
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      setMessageType('error');
      setMessage(
        error.response?.data?.message || 'Failed to change coadmin username'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-coadmin-username-container">
      <div className="username-form-card">
        <h2 className="form-title">
          <i className="fas fa-user-edit"></i> Change Coadmin Username
        </h2>
        <p className="form-subtitle">
          Update the login username for coadmin account
        </p>

        {message && (
          <div className={`alert alert-${messageType}`}>
            <i className={`fas fa-${messageType === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* New Username Field */}
          <div className="form-group">
            <label htmlFor="newUsername">New Username</label>
            <div className="input-wrapper">
              <i className="fas fa-at"></i>
              <input
                type="text"
                id="newUsername"
                placeholder="Enter new username (min. 3 characters)"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.trim())}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Confirm Username Field */}
          <div className="form-group">
            <label htmlFor="confirmUsername">Confirm Username</label>
            <div className="input-wrapper">
              <i className="fas fa-at"></i>
              <input
                type="text"
                id="confirmUsername"
                placeholder="Confirm new username"
                value={confirmUsername}
                onChange={(e) => setConfirmUsername(e.target.value.trim())}
                disabled={loading}
                required
              />
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
                <i className="fas fa-save"></i> Change Username
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
              <li>Coadmin will need to use new username to login</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
