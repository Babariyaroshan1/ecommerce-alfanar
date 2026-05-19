'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import './Profile.css';

// Predefined profile options using image avatars
const PROFILE_OPTIONS = [
  { id: 'avatar1', src: '/profile1.jpg', name: 'Profile 1', color: '#f97316' },
  { id: 'avatar2', src: '/profile.jpg', name: 'Profile 2', color: '#ff0000' },
  { id: 'avatar3', src: '/profile2.jpg', name: 'Profile 3', color: '#22c55e' },
  { id: 'avatar4', src: '/profile3.png', name: 'Profile 4', color: '#3b82f6' },
];

export default function Profile() {
  const { user, updateProfile } = useAuthStore();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    selectedProfile: user?.selectedProfile || 'avatar1',
    address: user?.address
      ? { ...user.address, houseNumber: user.address.houseNumber || '' }
      : { houseNumber: '' }
  });
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('address_')) {
      const key = name.replace('address_', '');
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [key]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProfileSelect = (profileId) => {
    setFormData(prev => ({ ...prev, selectedProfile: profileId }));
    setShowAvatarOptions(false);
  };

  const handleCloseAvatarOverlay = () => {
    setShowAvatarOptions(false);
  };

  const getSelectedProfile = () => {
    return PROFILE_OPTIONS.find(profile => profile.id === formData.selectedProfile) || PROFILE_OPTIONS[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await updateProfile(formData);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update profile: ' + (error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div>
          <h2>My Profile</h2>
          <p className="profile-subtitle">Update your personal information and select your profile avatar. You can change your avatar anytime!</p>
        </div>
      </div>

      {message && (
        <div className={`profile-alert ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {showAvatarOptions && (
        <div className="avatar-overlay" onClick={handleCloseAvatarOverlay}>
          <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="avatar-modal-header">
              <div>
                <h3>Choose Your Avatar</h3>
                <p>Select one avatar to use in your profile.</p>
              </div>
              <button type="button" className="avatar-modal-close" onClick={handleCloseAvatarOverlay}>
                ×
              </button>
            </div>
            <div className="profile-grid-selection avatar-grid-selection">
              {PROFILE_OPTIONS.map((profile) => (
                <div
                  key={profile.id}
                  className={`profile-option ${formData.selectedProfile === profile.id ? 'selected' : ''}`}
                  onClick={() => handleProfileSelect(profile.id)}
                  style={{ borderColor: formData.selectedProfile === profile.id ? profile.color : 'transparent' }}
                >
                  <div className="profile-avatar-option" style={{ borderColor: profile.color }}>
                    <img src={profile.src} alt={profile.name} />
                  </div>
                  <span className="profile-option-name">{profile.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="profile-grid">
        <aside className="profile-sidebar">
          <div className="profile-card profile-summary-card">
            <div className="profile-avatar-large">
              <div className="profile-avatar-selected" style={{ borderColor: getSelectedProfile().color }}>
                <img src={getSelectedProfile().src} alt={getSelectedProfile().name} />
              </div>
            </div>
            <div className="profile-info-block">
              <h3>{user.name || 'Your Name'}</h3>
              <p>{user.email || 'No email provided'}</p>
              <p>{user.phone || 'No phone number added'}</p>
              <p className="profile-type">Profile: {getSelectedProfile().name}</p>
            </div>

            <button
              type="button"
              className="avatar-toggle-button"
              onClick={() => setShowAvatarOptions(prev => !prev)}
            >
              {showAvatarOptions ? 'Hide Avatars' : 'Change Avatar'}
            </button>
          </div>

          <div className="profile-card profile-support-card">
            <h3>Privacy & Support</h3>
            <p>Manage your account settings and access helpful resources.</p>
            <a href="/privacy-policy" className="profile-link">Privacy Policy</a>
            <a href="#" className="profile-link">Help & Support</a>
          </div>
        </aside>

        <section className="profile-form-card profile-card">
          <form onSubmit={handleSubmit} className="profile-form">
            <h3>Personal Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>House Number</label>
                <input
                  type="text"
                  name="address_houseNumber"
                  value={formData.address.houseNumber || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group full-width">
                <label>Street Address</label>
                <input
                  type="text"
                  name="address_street"
                  value={formData.address.street || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="address_city"
                  value={formData.address.city || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  name="address_pincode"
                  value={formData.address.pincode || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="profile-button">
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}