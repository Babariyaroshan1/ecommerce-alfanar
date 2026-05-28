'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';
import './Register.css';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    countryCode: '+965',
    phone: '',
    houseNumber: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('registerFormData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setFormData(prev => ({ ...prev, ...parsedData }));
        } catch (e) {
          // Ignore invalid data
        }
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (typeof window !== 'undefined') {
        localStorage.setItem('registerFormData', JSON.stringify(newData));
      }
      return newData;
    });
  };

  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const normalizePhoneDigits = (value) => value.replace(/\D/g, '');

  const validatePhoneByCountry = (code, digits) => {
    if (code === '+91') return digits.length === 10;
    if (code === '+965') return digits.length === 8;
    return digits.length >= 7 && digits.length <= 15;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isValidEmail(formData.email)) {
      setError(t('Please enter a valid email address.'));
      setLoading(false);
      return;
    }

    const cleanedPhone = normalizePhoneDigits(formData.phone);
    if (!validatePhoneByCountry(formData.countryCode, cleanedPhone)) {
      if (formData.countryCode === '+91') {
        setError(t('Indian mobile number must be exactly 10 digits.'));
      } else if (formData.countryCode === '+965') {
        setError(t('Kuwait mobile number must be exactly 8 digits.'));
      } else {
        setError(t('Please enter a valid phone number.'));
      }
      setLoading(false);
      return;
    }

    try {
      const normalizedPhone = `${formData.countryCode}${cleanedPhone}`;

      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: normalizedPhone
      });

      if (typeof window !== 'undefined') {
        localStorage.removeItem('registerFormData');
      }
      router.push('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2 className="register-title">{t('Create Account')}</h2>
        <p className="register-description">{t('Create your account and save time during checkout with auto-filled data.')}</p>

        {error && <div className="register-error">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form" autoComplete="off">
          <input type="text" name="username" autoComplete="off" style={{ display: 'none' }} />
          <input type="password" name="new-password" autoComplete="new-password" style={{ display: 'none' }} />

          <div className="register-row">
            <input
              type="text"
              name="name"
              placeholder={t('Full Name *')}
              value={formData.name}
              onChange={handleChange}
              className="register-input"
              autoComplete="off"
              required
            />
            <input
              type="email"
              name="email"
              placeholder={t('Email (optional)')}
              value={formData.email}
              onChange={handleChange}
              className="register-input"
              autoComplete="email"
            />
          </div>

          <div className="register-row register-phone-row">
            <div className="register-phone-group">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="register-phone-select"
                autoComplete="off"
              >
                <option value="+965">+965 (Kuwait)</option>
                <option value="+91">+91 (India)</option>
              </select>
              <input
                type="tel"
                name="phone"
                placeholder={t('Phone Number *')}
                value={formData.phone}
                onChange={handleChange}
                className="register-input"
                autoComplete="off"
                required
              />
            </div>
            <div className="register-password-group">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder={t('Password *')}
                value={formData.password}
                onChange={handleChange}
                className="register-input register-password-input"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="register-button"
          >
            {loading ? t('Creating Account...') : t('Register')}
          </button>
        </form>

        <p className="register-link">
          {t("Already have an account?")} <Link href="/login">{t('Login')}</Link>
        </p>
      </div>
    </div>
  );
}
