'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useProductStore } from '@/store/productStore';
import './CurrencyManagement.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production

const COUNTRIES = [
  { name: 'Kuwait', currency: 'KWD', symbol: 'KWD' },
  { name: 'India', currency: 'INR', symbol: '₹' },
  { name: 'United States', currency: 'USD', symbol: '$' },
  { name: 'United Kingdom', currency: 'GBP', symbol: '£' },
  { name: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ' },
  { name: 'Saudi Arabia', currency: 'SAR', symbol: '﷼' },
  { name: 'Pakistan', currency: 'PKR', symbol: '₨' },
  { name: 'Bangladesh', currency: 'BDT', symbol: '৳' },
  { name: 'Germany', currency: 'EUR', symbol: '€' }
];

export default function CurrencyManagement() {
  const setCurrencySettings = useProductStore((state) => state.setCurrencySettings);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const [currentSettings, setCurrentSettings] = useState({
    country: 'India',
    currency: 'INR',
    symbol: '₹',
    shippingPriceKWD: 5,
    shippingPriceINR: 5,
    showKwdNavbarOption: false,
    showNewArrivalsNavbar: false
  });
  const [shippingPriceKwdInput, setShippingPriceKwdInput] = useState('5.000');
  const [shippingPriceInrInput, setShippingPriceInrInput] = useState('0');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    fetchCurrentSettings();
  }, []);

  const fetchCurrentSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      const settings = {
        country: response.data.country || 'India',
        currency: response.data.currency || 'INR',
        symbol: response.data.currencySymbol || '₹',
        shippingPriceKWD: response.data.shippingPriceKWD !== undefined ? Number(response.data.shippingPriceKWD) : (response.data.shippingPrice !== undefined ? Number(response.data.shippingPrice) : 5),
        shippingPriceINR: response.data.shippingPriceINR !== undefined ? Number(response.data.shippingPriceINR) : 0,
        showKwdNavbarOption: response.data.showKwdNavbarOption === true || response.data.showKwdNavbarOption === 'true',
        showNewArrivalsNavbar: response.data.showNewArrivalsNavbar === true || response.data.showNewArrivalsNavbar === 'true'
      };

      setCurrentSettings(settings);
      setShippingPriceKwdInput(String(settings.shippingPriceKWD));
      setShippingPriceInrInput(String(settings.shippingPriceINR));
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleShippingChange = async () => {
    const parsedShippingKWD = Number(shippingPriceKwdInput);
    const parsedShippingINR = Number(shippingPriceInrInput);
    if (isNaN(parsedShippingKWD) || parsedShippingKWD < 0 || isNaN(parsedShippingINR) || parsedShippingINR < 0) {
      setMessage('❌ Please enter valid shipping prices for both currencies.');
      return;
    }

    if (!token) {
      setMessage('❌ Admin token missing. Please login again.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await axios.put(`${API_URL}/settings/shipping`, {
        shippingPriceKWD: parsedShippingKWD,
        shippingPriceINR: parsedShippingINR
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newSettings = {
        ...currentSettings,
        shippingPriceKWD: parsedShippingKWD,
        shippingPriceINR: parsedShippingINR
      };

      setCurrentSettings(newSettings);
      setCurrencySettings(newSettings);
      await fetchProducts();

      setMessage('✅ Shipping prices updated successfully!');
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      const errorText = error.response?.data?.message || error.message;
      setMessage(`❌ Failed to update shipping price. ${errorText}`);
      console.error('Error updating shipping price:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavbarToggleChange = async (e) => {
    const enabled = e.target.checked;

    if (!token) {
      setMessage('❌ Admin token missing. Please login again.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await axios.put(`${API_URL}/settings/navbar-option`, {
        showKwdNavbarOption: enabled
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newSettings = {
        ...currentSettings,
        showKwdNavbarOption: enabled
      };

      setCurrentSettings(newSettings);
      setCurrencySettings(newSettings);
      setMessage(`✅ Navbar KWD option ${enabled ? 'enabled' : 'disabled'} successfully.`);
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      const errorText = error.response?.data?.message || error.message;
      setMessage(`❌ Failed to update navbar option. ${errorText}`);
      console.error('Error updating navbar option:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewArrivalsNavbarChange = async (e) => {
    const enabled = e.target.checked;

    if (!token) {
      setMessage('❌ Admin token missing. Please login again.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await axios.put(`${API_URL}/settings/new-arrivals-navbar`, {
        showNewArrivalsNavbar: enabled
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newSettings = {
        ...currentSettings,
        showNewArrivalsNavbar: enabled
      };

      setCurrentSettings(newSettings);
      setCurrencySettings(newSettings);
      setMessage(`✅ New Arrivals navbar link ${enabled ? 'enabled' : 'disabled'} successfully.`);
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      const errorText = error.response?.data?.message || error.message;
      setMessage(`❌ Failed to update New Arrivals navbar link. ${errorText}`);
      console.error('Error updating New Arrivals navbar link:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="currency-management">
      <div className="currency-header">
        <h2>Currency Management</h2>
        <p>Change the display currency for your entire store. Only main admin can modify this setting.</p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="currency-content">
        <div className="current-settings">
          <h3>Current Settings</h3>
          <div className="settings-display">
            <div className="setting-item">
              <span className="label">Country:</span>
              <span className="value">{currentSettings.country}</span>
            </div>
            <div className="setting-item">
              <span className="label">Currency:</span>
              <span className="value">{currentSettings.currency}</span>
            </div>
            <div className="setting-item">
              <span className="label">Symbol:</span>
              <span className="value">{currentSettings.symbol}</span>
            </div>
            <div className="setting-item">
              <span className="label">Shipping Price (KWD):</span>
              <span className="value">{currentSettings.symbol || 'KWD'} {currentSettings.shippingPriceKWD?.toFixed?.(3) ?? '5.000'}</span>
            </div>
            <div className="setting-item">
              <span className="label">Shipping Price (INR):</span>
              <span className="value">₹ {currentSettings.shippingPriceINR?.toFixed?.(2) ?? '0.00'}</span>
            </div>
            <div className="setting-item">
              <span className="label">Show KWD in Navbar:</span>
              <span className="value">{currentSettings.showKwdNavbarOption ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="setting-item">
              <span className="label">Show New Arrivals Link:</span>
              <span className="value">{currentSettings.showNewArrivalsNavbar ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>

        <div className="currency-settings">
          <h3>Toggle KWD/INR Currency Option in Navbar</h3>
          
          <div className="form-group navbar-toggle-group">
            <label htmlFor="show-kwd-navbar">Enable KWD & INR Toggle in Navbar</label>
            <div className="navbar-toggle-control">
              <label className="toggle-switch">
                <input
                  id="show-kwd-navbar"
                  type="checkbox"
                  checked={currentSettings.showKwdNavbarOption}
                  onChange={handleNavbarToggleChange}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className={`toggle-label ${currentSettings.showKwdNavbarOption ? 'on' : 'off'}`}>
                {currentSettings.showKwdNavbarOption ? 'On' : 'Off'}
              </span>
            </div>
            <p className="help-text">When enabled, users can toggle between KWD and INR currencies in the navbar. When disabled, only KWD prices are shown.</p>
          </div>

          <div className="form-group navbar-toggle-group">
            <label htmlFor="show-new-arrivals-navbar">Show New Arrivals link in Navbar</label>
            <div className="navbar-toggle-control">
              <label className="toggle-switch">
                <input
                  id="show-new-arrivals-navbar"
                  type="checkbox"
                  checked={currentSettings.showNewArrivalsNavbar}
                  onChange={handleNewArrivalsNavbarChange}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className={`toggle-label ${currentSettings.showNewArrivalsNavbar ? 'on' : 'off'}`}>
                {currentSettings.showNewArrivalsNavbar ? 'On' : 'Off'}
              </span>
            </div>
            <p className="help-text">When enabled, the New Arrivals link appears in the navbar. When disabled, the link remains hidden.</p>
          </div>

          <div className="form-group">
            <label>Shipping Price (KWD)</label>
            <input
              type="number"
              value={shippingPriceKwdInput}
              onChange={(e) => setShippingPriceKwdInput(e.target.value)}
              placeholder="5.000"
              step="0.001"
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Shipping Price (INR)</label>
            <input
              type="number"
              value={shippingPriceInrInput}
              onChange={(e) => setShippingPriceInrInput(e.target.value)}
              placeholder="1351.35"
              step="0.01"
              min="0"
            />
          </div>
          <div className="form-group">
            <button
              type="button"
              className="update-btn secondary"
              onClick={handleShippingChange}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Shipping Prices'}
            </button>
          </div>
        </div>

        <div className="currency-info">
          <h3>Important Notes</h3>
          <ul>
            <li>All product prices will be automatically converted and displayed in the selected currency</li>
            <li>The conversion uses current exchange rates and may be updated periodically</li>
            <li>Order records will continue to show the original currency they were placed in</li>
            <li>This change affects the entire website immediately</li>
          </ul>
        </div>
      </div>
    </div>
  );
}