'use client';

import React, { useEffect } from 'react';
import './NotificationModal.css';

const NotificationModal = ({ message, type = 'success', isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    // Auto-close success messages after 2 seconds
    if (type === 'success') {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, type, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="notification-overlay" onClick={onClose} />
      <div className={`notification-modal notification-${type}`}>
        <div className="notification-content">
          <div className="notification-icon">
            {type === 'success' ? '✓' : '✕'}
          </div>
          <p className="notification-message">{message}</p>
        </div>
        {type === 'error' && (
          <button className="notification-close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>
    </>
  );
};

export default NotificationModal;
