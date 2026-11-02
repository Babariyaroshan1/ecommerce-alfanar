'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import AccountSidebar, { useAccountHydrated } from './AccountSidebar';
import './Profile.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string }>(error)) return error.response?.data?.message || error.message || fallback;
  return error instanceof Error ? error.message : fallback;
};

export default function Profile() {
  const { user, token, updateProfile } = useAuthStore();
  const router = useRouter();
  const hydrated = useAccountHydrated();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const initialForm = useMemo(() => {
    const [firstName = '', ...lastParts] = String(user?.name || '').split(' ');
    return {
      firstName,
      lastName: lastParts.join(' '),
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
      gender: user?.gender || ''
    };
  }, [user]);
  const [formOverrides, setFormOverrides] = useState(null);
  const formData = formOverrides || initialForm;
  const setFormData = (next: typeof initialForm) => setFormOverrides(next);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/profile');
      return;
    }
  }, [user, router]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateProfile({
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender
      });
      setMessage('Your profile has been saved.');
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, 'Unable to save your profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage('');
    if (passwordData.newPassword.length < 8) {
      setPasswordMessage('Use at least 8 characters for your new password.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('The new passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await axios.put(`${API_URL}/auth/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, { headers: { Authorization: `Bearer ${token}` } });
      setPasswordMessage('Password updated successfully.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: unknown) {
      setPasswordMessage(getErrorMessage(error, 'Unable to update your password. Please try again.'));
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!hydrated || !user) return null;

  return (
    <main className="profile-container account-page">
      <div className="account-page-layout">
        <AccountSidebar active="profile" />
        <section className="profile-main">
          <h1 className="profile-main-title">Edit Profile</h1>
          {message && <p className={`profile-alert ${message.startsWith('Your') ? 'success' : 'error'}`} role="status">{message}</p>}
          <form className="profile-card profile-form" onSubmit={handleProfileSubmit}>
            <div className="profile-account-fields">
              <label className="profile-field">
                <span>Email Id</span>
                <input type="email" value={user.email || ''} readOnly />
              </label>
              <label className="profile-field">
                <span>Password <button type="button" className="profile-text-action" onClick={() => { setPasswordOpen(true); setPasswordMessage(''); }}>Change Password</button></span>
                <input type="password" value="password-hidden" readOnly aria-label="Password is hidden" />
              </label>
            </div>
            <hr />
            <h2>General Information</h2>
            <div className="profile-fields-grid">
              <label className="profile-field">
                <span>First Name</span>
                <input required value={formData.firstName} onChange={(event) => setFormData({ ...formData, firstName: event.target.value })} />
              </label>
              <label className="profile-field">
                <span>Last Name</span>
                <input value={formData.lastName} onChange={(event) => setFormData({ ...formData, lastName: event.target.value })} />
              </label>
              <label className="profile-field">
                <span>Date of Birth</span>
                <input type="date" value={formData.dateOfBirth} onChange={(event) => setFormData({ ...formData, dateOfBirth: event.target.value })} />
              </label>
              <label className="profile-field">
                <span>Mobile Number</span>
                <input type="tel" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} required />
              </label>
              <fieldset className="profile-gender-field">
                <legend>Gender</legend>
                {['Male', 'Female', 'Other'].map((gender) => (
                  <label key={gender}><input type="radio" name="gender" value={gender} checked={formData.gender === gender} onChange={(event) => setFormData({ ...formData, gender: event.target.value })} /> {gender}</label>
                ))}
              </fieldset>
            </div>
            <button className="profile-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </form>
        </section>
      </div>

      {passwordOpen && (
        <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !passwordSaving) setPasswordOpen(false);
        }}>
          <section className="profile-password-modal" role="dialog" aria-modal="true" aria-labelledby="password-dialog-title">
            <button type="button" className="profile-modal-close" onClick={() => setPasswordOpen(false)} aria-label="Close change password dialog">×</button>
            <h2 id="password-dialog-title">Change Password</h2>
            <form onSubmit={handlePasswordSubmit}>
              <label className="profile-field"><span>Current Password</span><input type="password" autoComplete="current-password" value={passwordData.currentPassword} onChange={(event) => setPasswordData({ ...passwordData, currentPassword: event.target.value })} required /></label>
              <label className="profile-field"><span>New Password</span><input type="password" autoComplete="new-password" value={passwordData.newPassword} onChange={(event) => setPasswordData({ ...passwordData, newPassword: event.target.value })} required minLength={8} /></label>
              <label className="profile-field"><span>Confirm Password</span><input type="password" autoComplete="new-password" value={passwordData.confirmPassword} onChange={(event) => setPasswordData({ ...passwordData, confirmPassword: event.target.value })} required minLength={8} /></label>
              {passwordMessage && <p className={`profile-alert ${passwordMessage.includes('successfully') ? 'success' : 'error'}`} role="status">{passwordMessage}</p>}
              <button type="submit" className="profile-button" disabled={passwordSaving}>{passwordSaving ? 'Saving…' : 'Save Password'}</button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
