import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function BannerSettings() {
  const [bannerUrl, setBannerUrl] = useState('');
  const [mobileBannerUrl, setMobileBannerUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [savedMobileUrl, setSavedMobileUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/settings`);
        const currentBanner = response.data.homeBannerImageUrl || response.data.bannerImageUrl || '';
        const currentMobileBanner = response.data.homeBannerMobileImageUrl || response.data.mobileBannerImageUrl || '';

        setBannerUrl(currentBanner);
        setMobileBannerUrl(currentMobileBanner);
        setSavedUrl(currentBanner);
        setSavedMobileUrl(currentMobileBanner);
      } catch (error) {
        console.error('Error fetching banner settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  const uploadImageFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.url;
  };

  const handleFileUpload = async (file, setUrl, setLoadingState) => {
    if (!file) return;

    setLoadingState(true);
    setMessage('');

    try {
      const uploadedUrl = await uploadImageFile(file);
      setUrl(uploadedUrl);
      setMessage('Image uploaded successfully. Click Save Banner to persist it.');
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(error.response?.data?.message || 'Image upload failed.');
    } finally {
      setLoadingState(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      await axios.put(
        `${API_URL}/settings/banner`,
        { bannerImageUrl: bannerUrl, mobileBannerImageUrl: mobileBannerUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedUrl(bannerUrl);
      setSavedMobileUrl(mobileBannerUrl);
      setMessage('Banner settings updated successfully.');
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
      <p>
        Update the homepage banner image URLs. Use a valid image URL or a public path like <code>/banner.png</code>.
        The mobile banner will be used on smaller screens when provided.
      </p>

      {loading ? (
        <div>Loading banner settings...</div>
      ) : (
        <>
          <div className="form-group">
            <label htmlFor="bannerUrl">Desktop Banner Image URL</label>
            <input
              id="bannerUrl"
              type="text"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="form-control"
              placeholder="Enter desktop banner image URL or public path"
            />
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label htmlFor="desktopBannerUpload" className="btn btn-outline-secondary mb-0" style={{ cursor: 'pointer' }}>
                {uploadingDesktop ? 'Uploading…' : 'Upload desktop image'}
              </label>
              <input
                id="desktopBannerUpload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                disabled={uploadingDesktop}
                onChange={(e) => handleFileUpload(e.target.files?.[0], setBannerUrl, setUploadingDesktop)}
              />
              {bannerUrl && <span style={{ color: '#4b5563' }}>Preview URL set</span>}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label htmlFor="mobileBannerUrl">Mobile Banner Image URL</label>
            <input
              id="mobileBannerUrl"
              type="text"
              value={mobileBannerUrl}
              onChange={(e) => setMobileBannerUrl(e.target.value)}
              className="form-control"
              placeholder="Enter mobile banner image URL or public path"
            />
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label htmlFor="mobileBannerUpload" className="btn btn-outline-secondary mb-0" style={{ cursor: 'pointer' }}>
                {uploadingMobile ? 'Uploading…' : 'Upload mobile image'}
              </label>
              <input
                id="mobileBannerUpload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                disabled={uploadingMobile}
                onChange={(e) => handleFileUpload(e.target.files?.[0], setMobileBannerUrl, setUploadingMobile)}
              />
              {mobileBannerUrl && <span style={{ color: '#4b5563' }}>Preview URL set</span>}
            </div>
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
            <p className="mb-2"><strong>Banner Preview</strong></p>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <p style={{ marginBottom: '8px' }}><strong>Desktop</strong></p>
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Desktop banner preview"
                    style={{ width: '100%', maxWidth: '600px', height: 'auto', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                ) : (
                  <div style={{ color: '#6b7280' }}>No desktop banner URL configured yet.</div>
                )}
              </div>
              <div>
                <p style={{ marginBottom: '8px' }}><strong>Mobile</strong></p>
                {mobileBannerUrl ? (
                  <img
                    src={mobileBannerUrl}
                    alt="Mobile banner preview"
                    style={{ width: '100%', maxWidth: '360px', height: 'auto', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                ) : (
                  <div style={{ color: '#6b7280' }}>
                    No mobile banner URL configured yet. The desktop banner will be used on mobile devices.
                  </div>
                )}
              </div>
            </div>
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
