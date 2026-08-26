'use client';

import React, { useMemo, useState } from 'react';
import './Credits.css';

const initialOverview = [
  { title: 'Current Balance', value: 'KWD 12.450', description: 'Total available credit balance' },
  { title: 'Email Credits', value: '8,500', description: 'Remaining email sends' },
  { title: 'SMS Credits', value: '2,800', description: 'Remaining SMS credits' },
  { title: 'Push Credits', value: '4,100', description: 'Remaining push notifications' },
  { title: 'WhatsApp Credits', value: '1,200', description: 'Remaining WhatsApp sends' },
  { title: 'Monthly Usage', value: '32%', description: 'Credit usage this month' }
];

const historyItems = [
  { date: '2026-08-04', provider: 'Resend', type: 'Email', added: '500', used: '120', balance: '8,500', paymentId: 'PAY-7421', status: 'Completed', admin: 'Admin' },
  { date: '2026-08-02', provider: 'Twilio', type: 'SMS', added: '1,500', used: '600', balance: '2,800', paymentId: 'PAY-7417', status: 'Completed', admin: 'Admin' },
  { date: '2026-07-30', provider: 'Firebase', type: 'Push', added: '2,000', used: '1,200', balance: '4,100', paymentId: 'PAY-7409', status: 'Pending', admin: 'Co-Admin' },
  { date: '2026-07-28', provider: 'Meta WhatsApp', type: 'WhatsApp', added: '800', used: '310', balance: '1,200', paymentId: 'PAY-7401', status: 'Completed', admin: 'Admin' }
];

const providerSettings = [
  { provider: 'Resend Email', status: 'Active', subtitle: 'Transactional email provider' },
  { provider: 'Twilio SMS', status: 'Active', subtitle: 'SMS delivery provider' },
  { provider: 'Firebase Push', status: 'Active', subtitle: 'Push notification provider' },
  { provider: 'Meta WhatsApp', status: 'Active', subtitle: 'WhatsApp messaging provider' }
];

export default function Credits() {
  const [query, setQuery] = useState('');

  const filteredHistory = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return historyItems;
    return historyItems.filter((item) =>
      item.provider.toLowerCase().includes(lower) ||
      item.type.toLowerCase().includes(lower) ||
      item.paymentId.toLowerCase().includes(lower) ||
      item.status.toLowerCase().includes(lower)
    );
  }, [query]);

  return (
    <div className="credits-page">
      <div className="module-header">
        <div>
          <p className="section-eyebrow">Credits</p>
          <h2 className="page-title">Credit management</h2>
          <p className="page-subtitle">Track your communication credits, purchase history, and provider settings from one central dashboard.</p>
        </div>
        <div className="module-actions">
          <button className="action-btn secondary">Export</button>
          <button className="action-btn primary">Add Credits</button>
        </div>
      </div>

      <div className="stats-grid">
        {initialOverview.map((item) => (
          <div key={item.title} className="stat-card">
            <div className="stat-card-header">
              <p>{item.title}</p>
            </div>
            <p className="stat-value numeric-value">{item.value}</p>
            <p className="stat-caption">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="section-card">
        <div className="section-card-header">
          <div>
            <h3>Credit history</h3>
            <p>Recent credit allocations and usage events for admin review.</p>
          </div>
          <div className="search-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search history..."
            />
          </div>
        </div>

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Provider</th>
                <th>Type</th>
                <th>Added</th>
                <th>Used</th>
                <th>Balance</th>
                <th>Payment ID</th>
                <th>Status</th>
                <th>Admin</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={`${item.paymentId}-${item.date}`}>
                  <td>{item.date}</td>
                  <td>{item.provider}</td>
                  <td>{item.type}</td>
                  <td className="numeric-value">{item.added}</td>
                  <td className="numeric-value">{item.used}</td>
                  <td className="numeric-value">{item.balance}</td>
                  <td>{item.paymentId}</td>
                  <td><span className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</span></td>
                  <td>{item.admin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-card section-grid">
        <div className="provider-card">
          <div className="section-card-title">Connected providers</div>
          <div className="provider-list">
            {providerSettings.map((provider) => (
              <div key={provider.provider} className="provider-item">
                <div>
                  <strong>{provider.provider}</strong>
                  <p>{provider.subtitle}</p>
                </div>
                <span className={`status-pill ${provider.status.toLowerCase()}`}>{provider.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="provider-card">
          <div className="section-card-title">Monthly consumption</div>
          <div className="usage-grid">
            <div className="usage-item">
              <span>Email</span>
              <strong>2,860</strong>
            </div>
            <div className="usage-item">
              <span>SMS</span>
              <strong>1,680</strong>
            </div>
            <div className="usage-item">
              <span>Push</span>
              <strong>3,200</strong>
            </div>
            <div className="usage-item">
              <span>WhatsApp</span>
              <strong>890</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
