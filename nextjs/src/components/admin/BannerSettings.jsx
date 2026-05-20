import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function BannerSettings() {
  const [bannerUrl, setBannerUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/settings`);
        const currentBanner = response.data.homeBannerImageUrl || response.data.bannerImageUrl || '';
        setBannerUrl(currentBanner);
        setSavedUrl(currentBanner);
      } catch (error) {
        console.error('Error fetching banner settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      await axios.put(
        `${API_URL}/settings/banner`,
        { bannerImageUrl: bannerUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedUrl(bannerUrl);
      setMessage('Banner URL updated successfully.');
    } catch (error) {
      console.error('Error saving banner URL:', error);
      setMessage(error.response?.data?.message || 'Unable to save banner URL.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-settings-section">
      <h2>Homepage Banner Settings</h2>
      <p>Update the homepage banner image URL. Use a valid image URL or a public path like <code>/banner.png</code>.</p>

      {loading ? (
        <div>Loading banner settings...</div>
      ) : (
        <>
          <div className="form-group">
            <label htmlFor="bannerUrl">Banner Image URL</label>
            <input
              id="bannerUrl"
              type="text"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="form-control"
              placeholder="Enter image URL or public path"
            />
          </div>

          <div className="form-actions" style={{ marginTop: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || bannerUrl.trim().length === 0}
            >
              {saving ? 'Saving...' : 'Save Banner'}
            </button>
          </div>

          {message && <div style={{ marginTop: '12px' }} className="text-muted">{message}</div>}

          <div style={{ marginTop: '24px' }}>
            <p className="mb-2"><strong>Preview</strong></p>
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt="Banner preview"
                style={{ width: '100%', maxWidth: '600px', height: 'auto', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            ) : (
              <div style={{ color: '#6b7280' }}>No banner URL configured yet.</div>
            )}
          </div>

          <div style={{ marginTop: '16px' }}>
            <p className="text-muted" style={{ fontSize: '0.95rem' }}>
              Tip: If you use a direct image URL, make sure it is publicly accessible. For local static images, upload them to the <code>public</code> folder and use a path like <code>/banner.png</code>.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
