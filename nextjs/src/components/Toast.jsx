'use client';

import React, { useState, useEffect } from 'react';
import { useToastStore } from '../store/toastStore';
import './Toast.css';

export default function Toast() {
  const { toasts, removeToast } = useToastStore();
  const [mounted, setMounted] = useState(false);

  const handleActionClick = (toast) => {
    if (toast.action?.callback) {
      toast.action.callback();
    }
    removeToast(toast.id);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-notification toast-${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <div className="toast-content">
            <span className="toast-icon" aria-hidden>{/* Smart icons: wishlist (heart) vs cart vs default check */}
              {toast.message.toLowerCase().includes('wishlist') ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21s-7.5-4.35-10-7.1C-1 9 3 4 8 6c2 1 3 3 4 3s2-2 4-3c5-2 9 3 6 7.9C19.5 16.65 12 21 12 21z" />
                </svg>
              ) : toast.message.toLowerCase().includes('cart') || toast.message.toLowerCase().includes('added to cart') ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </span>
            <span className="toast-message">{toast.message.replace(/^[^\w\d]+/u, '').trim()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {toast.action?.label && (
              <button
                className="toast-action"
                onClick={() => handleActionClick(toast)}
              >
                {toast.action.label}
              </button>
            )}
            <button
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
