'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PaymentMethodsManagement.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', description: 'Unified Payments Interface (India)' },
  { id: 'card', label: 'Credit/Debit Card', description: 'Visa, Mastercard, etc.' },
  { id: 'netbanking', label: 'Net Banking', description: 'Online bank transfers' },
  { id: 'cod', label: 'Cash on Delivery', description: 'Pay when you receive your order' }
];

export default function PaymentMethodsManagement() {
  const [enabledMethods, setEnabledMethods] = useState(['upi', 'card', 'netbanking', 'cod']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings/payment-methods`);
      setEnabledMethods(response.data.enabledPaymentMethods || ['upi', 'card', 'netbanking', 'cod']);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setMessage('[ERROR] Failed to load payment methods. Using defaults.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleMethodToggle = (methodId) => {
    setEnabledMethods((prev) => {
      if (prev.includes(methodId)) {
        // Remove method if all methods are enabled and this is the last one
        if (prev.length === 1) {
          setMessage('[ERROR] At least one payment method must be enabled.');
          return prev;
        }
        return prev.filter((m) => m !== methodId);
      } else {
        return [...prev, methodId];
      }
    });
  };

  const handleSaveChanges = async () => {
    if (!token) {
      setMessage('[ERROR] Admin token missing. Please login again.');
      return;
    }

    if (enabledMethods.length === 0) {
      setMessage('[ERROR] At least one payment method must be enabled.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.put(
        `${API_URL}/settings/payment-methods`,
        { enabledPaymentMethods: enabledMethods },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage('[SUCCESS] Payment methods updated successfully!');
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      const errorText = error.response?.data?.message || error.message;
      setMessage(`[ERROR] Failed to update payment methods. ${errorText}`);
      console.error('Error updating payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isInitializing) {
    return <div className="pm-loading-state">Loading payment methods...</div>;
  }

  return (
    <div className="pm-container">
      <div className="pm-header-section">
        <h2>Payment Methods Management</h2>
        <p>Enable or disable payment methods available to customers. Only main admin can modify this setting.</p>
      </div>

      {message && (
        <div className={`pm-message-alert ${message.includes('[SUCCESS]') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="pm-content-layout">
        
        {/* Left Side: Methods Settings */}
        <div className="pm-main-panel">
          <div>
            <h3>Available Payment Methods</h3>
            <p className="pm-subtitle">Toggle payment methods on/off for customers. At least one method must be enabled.</p>
          </div>

          <div className="pm-card-grid">
            {PAYMENT_METHODS.map((method) => {
              const isEnabled = enabledMethods.includes(method.id);
              return (
                <div key={method.id} className="pm-method-card">
                  <div className="pm-method-info">
                    <div className="pm-method-title">
                      <span className="pm-method-label">{method.label}</span>
                      <span className={`pm-status-badge ${isEnabled ? 'enabled' : 'disabled'}`}>
                        {isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="pm-method-desc">{method.description}</p>
                  </div>

                  {/* PREMIUM TOGGLE SWITCH */}
                  <label className="pm-premium-toggle">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleMethodToggle(method.id)}
                      disabled={loading}
                    />
                    <span className="pm-toggle-track"></span>
                  </label>
                </div>
              );
            })}
          </div>

          <div className="pm-action-group">
            <button
              className="pm-btn-primary"
              onClick={handleSaveChanges}
              disabled={loading || enabledMethods.length === 0}
            >
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
            <button
              className="pm-btn-secondary"
              onClick={() => {
                setEnabledMethods(['upi', 'card', 'netbanking', 'cod']);
                setMessage('');
              }}
              disabled={loading}
            >
              Reset to Default
            </button>
          </div>
        </div>

        {/* Right Side: Information Panel */}
        <div className="pm-info-sidebar">
          <h3>Important Notes</h3>
          <ul className="pm-info-list">
            <li>Customers will only see enabled payment methods during checkout.</li>
            <li>Disabled methods will not be available for new orders.</li>
            <li>At least one payment method must always be enabled.</li>
            <li>Changes take effect immediately for all users globally.</li>
            <li>This setting is admin-only and cannot be modified by co-admins.</li>
          </ul>
        </div>
        
      </div>
    </div>
  );
}