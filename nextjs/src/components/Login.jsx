'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';
import './Login.css';
import ContactFormSkeleton from './ContactFormSkeleton';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [countryCode, setCountryCode] = useState('+965');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(true);
  const [error, setError] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const { login, sendOtp, verifyOtp } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    setLoginLoading(false);
  }, []);

  // Get redirect URL from query params
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const redirectTo = searchParams.get('redirect') || '/';

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
    setOtpMessage('');

    try {
      let loginIdentifier = identifier.trim();
      if (!loginIdentifier) {
        setError(t('Please enter email or mobile number.'));
        setLoading(false);
        return;
      }

      if (loginIdentifier.includes('@')) {
        if (!isValidEmail(loginIdentifier)) {
          setError(t('Please enter a valid email address.'));
          setLoading(false);
          return;
        }
      } else {
        const digits = normalizePhoneDigits(loginIdentifier);
        let selectedCode = countryCode;

        const prefixMatch = loginIdentifier.match(/^\+(\d{1,4})/);
        if (prefixMatch) {
          selectedCode = `+${prefixMatch[1]}`;
        }

        if (!validatePhoneByCountry(selectedCode, digits)) {
          if (selectedCode === '+91') {
            setError(t('Indian mobile number must be exactly 10 digits.'));
          } else if (selectedCode === '+965') {
            setError(t('Kuwait mobile number must be exactly 8 digits.'));
          } else {
            setError(t('Please enter a valid phone number.'));
          }
          setLoading(false);
          return;
        }

        if (!loginIdentifier.startsWith('+')) {
          loginIdentifier = `${countryCode}${digits}`;
        } else {
          loginIdentifier = `+${digits}`;
        }
      }

      if (otpMode) {
        if (!otpSent) {
          const channel = loginIdentifier.includes('@') ? 'email' : 'sms';
          await sendOtp(loginIdentifier, channel);
          setOtpSent(true);
          setOtpMessage(t('OTP sent successfully. Please check your phone or email.'));
        } else {
          if (!otpCode.trim()) {
            setError(t('Please enter the OTP code.'));
            setLoading(false);
            return;
          }
          const response = await verifyOtp(loginIdentifier, otpCode.trim());
          if (!response.token) {
            setError(t('OTP verified successfully, but user account was not found.'));
            setLoading(false);
            return;
          }
          router.push(redirectTo);
        }
      } else {
        await login(loginIdentifier, password);
        router.push(redirectTo);
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{t('Login')}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} autoComplete="off">
          <input type="text" name="username" autoComplete="off" style={{ display: 'none' }} />
          <input type="password" name="new-password" autoComplete="new-password" style={{ display: 'none' }} />

          <div className="form-group">
            <label>{t('Email or Mobile')}</label>
            <div className="input-row">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="country-code-select"
                autoComplete="off"
              >
                <option value="+965">🇰🇼 +965</option>
                <option value="+91">🇮🇳 +91</option>
              </select>
              <input
                type="text"
                placeholder={t('Email or Phone')}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="form-input"
                autoComplete="off"
                required
              />
            </div>
          </div>

          {!otpMode && (
            <div className="form-group password-group">
              <label>{t('Password')}</label>
              <div className="password-row">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('Password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  aria-label={showPassword ? t('Hide Password') : t('Show Password')}
                >
                  {showPassword ? t('Hide') : t('Show')}
                </button>
              </div>
            </div>
          )}

          {otpMode && otpSent && (
            <div className="form-group">
              <label>{t('Enter OTP')}</label>
              <input
                type="text"
                placeholder={t('OTP Code')}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="form-input"
                autoComplete="off"
                required
              />
            </div>
          )}

          {otpMessage && <div className="success-message">{otpMessage}</div>}

          <div className="form-group text-right">
            {!otpMode ? (
              <Link href="/forgot-password" className="forgot-link">
                {t('Forgot Password?')}
              </Link>
            ) : (
              <button
                type="button"
                className="forgot-link otp-back"
                onClick={() => {
                  setOtpMode(false);
                  setOtpSent(false);
                  setOtpCode('');
                  setOtpMessage('');
                  setError('');
                }}
              >
                {t('Use password login')}
              </button>
            )}
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? t('Logging in...') : t('Login')}
          </button>
        </form>

        <div className="toggle-form">
          <button
            type="button"
            className="otp-toggle"
            onClick={() => {
              setOtpMode(!otpMode);
              setOtpSent(false);
              setOtpCode('');
              setOtpMessage('');
              setError('');
            }}
          >
            {otpMode ? t('Use password login') : t('Login with OTP')}
          </button>
        </div>

        <div className="toggle-form">
          <p>{t("Don't have an account?")}</p>
          <Link href="/register">{t('Register')}</Link>
        </div>
      </div>
    </div>
  );
}