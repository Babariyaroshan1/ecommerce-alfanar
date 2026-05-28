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
      setMessage('❌ Failed to load payment methods. Using defaults.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleMethodToggle = (methodId) => {
    setEnabledMethods((prev) => {
      if (prev.includes(methodId)) {
        // Remove method if all methods are enabled and this is the last one
        if (prev.length === 1) {
          setMessage('❌ At least one payment method must be enabled.');
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
      setMessage('❌ Admin token missing. Please login again.');
      return;
    }

    if (enabledMethods.length === 0) {
      setMessage('❌ At least one payment method must be enabled.');
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

      setMessage('✅ Payment methods updated successfully!');
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      const errorText = error.response?.data?.message || error.message;
      setMessage(`❌ Failed to update payment methods. ${errorText}`);
      console.error('Error updating payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isInitializing) {
    return <div className="payment-methods-loading">Loading payment methods...</div>;
  }

  return (
    <div className="payment-methods-management">
      <div className="payment-header">
        <h2>Payment Methods Management</h2>
        <p>Enable or disable payment methods available to customers. Only main admin can modify this setting.</p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="payment-content">
        <div className="payment-methods-list">
          <h3>Available Payment Methods</h3>
          <p className="subtitle">Toggle payment methods on/off for customers. At least one method must be enabled.</p>

          <div className="methods-grid">
            {PAYMENT_METHODS.map((method) => (
              <div key={method.id} className="method-card">
                <div className="method-header">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={enabledMethods.includes(method.id)}
                      onChange={() => handleMethodToggle(method.id)}
                      disabled={loading}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="method-label">{method.label}</span>
                </div>
                <p className="method-description">{method.description}</p>
                <span className={`status-badge ${enabledMethods.includes(method.id) ? 'enabled' : 'disabled'}`}>
                  {enabledMethods.includes(method.id) ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>

          <div className="action-buttons">
            <button
              className="btn-save"
              onClick={handleSaveChanges}
              disabled={loading || enabledMethods.length === 0}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              className="btn-reset"
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

        <div className="payment-info">
          <h3>Important Notes</h3>
          <ul>
            <li>Customers will only see enabled payment methods during checkout</li>
            <li>Disabled methods will not be available for new orders</li>
            <li>At least one payment method must always be enabled</li>
            <li>Changes take effect immediately for all users</li>
            <li>This setting is admin-only and cannot be modified by co-admins</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
