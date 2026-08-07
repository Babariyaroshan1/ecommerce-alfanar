'use client';

import React, { useMemo, useState } from 'react';
import './Notifications.css';

const notificationTemplates = [
  { name: 'Order Placed', channel: 'Email', description: 'Notifies customer when order is placed.' },
  { name: 'Order Confirmed', channel: 'SMS', description: 'Sends confirmation SMS after payment.' },
  { name: 'Preparing', channel: 'Push', description: 'Push alert when order is being prepared.' },
  { name: 'Out for Delivery', channel: 'WhatsApp', description: 'WhatsApp update when order is out for delivery.' },
  { name: 'Delivered', channel: 'Email', description: 'Delivery confirmation email to customer.' },
  { name: 'Cancelled', channel: 'SMS', description: 'Cancel notification for the order.' }
];

const notificationLogs = [
  { date: '2026-08-06 11:25', customer: 'Noor Al-Hamadi', provider: 'Resend', template: 'Order Placed', status: 'Delivered', retry: 0 },
  { date: '2026-08-06 11:17', customer: 'Fahad Saleh', provider: 'Twilio', template: 'OTP Login', status: 'Failed', retry: 1 },
  { date: '2026-08-06 10:45', customer: 'Aisha Omar', provider: 'Firebase', template: 'Out for Delivery', status: 'Delivered', retry: 0 }
];

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('overview');
  const [query, setQuery] = useState('');

  const filteredLogs = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return notificationLogs;
    return notificationLogs.filter((log) =>
      log.customer.toLowerCase().includes(lower) ||
      log.provider.toLowerCase().includes(lower) ||
      log.template.toLowerCase().includes(lower) ||
      log.status.toLowerCase().includes(lower)
    );
  }, [query]);

  return (
    <div className="notifications-page">
      <div className="module-header">
        <div>
          <p className="section-eyebrow">Notifications</p>
          <h2 className="page-title">Notification center</h2>
          <p className="page-subtitle">Manage templates, automation rules, and delivery logs for email, SMS, push, and WhatsApp.</p>
        </div>
      </div>

      <div className="tab-list">
        {['overview', 'templates', 'automation', 'logs', 'settings'].map((tabId) => (
          <button
            key={tabId}
            className={`tab-button ${activeTab === tabId ? 'active' : ''}`}
            onClick={() => setActiveTab(tabId)}
          >
            {tabId.charAt(0).toUpperCase() + tabId.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="section-grid">
          <div className="overview-card">
            <div className="card-head">
              <h3>Daily totals</h3>
              <span className="pill">Updated now</span>
            </div>
            <div className="overview-grid">
              <div className="overview-stat">
                <span>Emails Today</span>
                <strong>1,280</strong>
              </div>
              <div className="overview-stat">
                <span>SMS Today</span>
                <strong>980</strong>
              </div>
              <div className="overview-stat">
                <span>Push Today</span>
                <strong>1,140</strong>
              </div>
              <div className="overview-stat">
                <span>WhatsApp Today</span>
                <strong>670</strong>
              </div>
              <div className="overview-stat">
                <span>Failed</span>
                <strong>14</strong>
              </div>
              <div className="overview-stat">
                <span>Queue</span>
                <strong>10</strong>
              </div>
            </div>
          </div>
          <div className="overview-card highlight-card">
            <div className="card-head">
              <h3>Automation status</h3>
              <span className="pill secondary">Live</span>
            </div>
            <div className="automation-list">
              {['Order Placed', 'Order Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refund', 'OTP Login', 'Forgot Password', 'Admin Login', 'Low Stock'].map((item) => (
                <div key={item} className="automation-item">
                  <span>{item}</span>
                  <span className="status-pill completed">Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <h3>Notification templates</h3>
              <p>Manage template content and delivery channels.</p>
            </div>
            <button className="action-btn primary">New template</button>
          </div>
          <div className="template-grid">
            {notificationTemplates.map((template) => (
              <div key={template.name} className="template-card">
                <div className="template-card-head">
                  <h4>{template.name}</h4>
                  <span className="pill secondary">{template.channel}</span>
                </div>
                <p>{template.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <h3>Automation rules</h3>
              <p>Enable or disable notification automation for key order and auth events.</p>
            </div>
          </div>
          <div className="automation-grid">
            {['Order Placed', 'Order Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refund', 'OTP Login', 'Forgot Password', 'Admin Login', 'Low Stock'].map((item) => (
              <label key={item} className="toggle-row">
                <span>{item}</span>
                <button type="button" className="toggle-switch on">Enabled</button>
              </label>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <h3>Notification logs</h3>
              <p>Track recent delivery attempts and retry status.</p>
            </div>
            <div className="search-row">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search logs..."
              />
            </div>
          </div>
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Provider</th>
                  <th>Template</th>
                  <th>Status</th>
                  <th>Retry</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={`${log.date}-${log.customer}`}>
                    <td>{log.date}</td>
                    <td>{log.customer}</td>
                    <td>{log.provider}</td>
                    <td>{log.template}</td>
                    <td><span className={`status-pill ${log.status.toLowerCase()}`}>{log.status}</span></td>
                    <td>{log.retry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="section-card">
          <div className="section-card-header">
            <div>
              <h3>Notification settings</h3>
              <p>Provider configuration and API key management.</p>
            </div>
          </div>
          <div className="settings-grid">
            {['Resend', 'Firebase', 'Twilio', 'MSG91', 'Meta WhatsApp'].map((provider) => (
              <div key={provider} className="setting-card">
                <h4>{provider}</h4>
                <p>Store secure API credentials and toggle provider usage.</p>
                <button className="action-btn secondary">Configure</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
