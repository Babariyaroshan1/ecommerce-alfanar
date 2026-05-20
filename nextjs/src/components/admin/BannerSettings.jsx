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
      console.log('✅ Uploaded URL:', uploadedUrl);
      setUrl(uploadedUrl);
      setMessage(`✅ Image uploaded to Cloudinary. URL: ${uploadedUrl.substring(0, 50)}...`);
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(error.response?.data?.message || 'Image upload failed.');
    } finally {
      setLoadingState(false);
    }
  };

  const handleSave = async () => {
    if (!bannerUrl.trim()) {
      setMessage('Desktop banner URL is required.');
      return;
    }

    // Warn if URL looks like a relative path that won't exist
    if (bannerUrl.startsWith('/') && !bannerUrl.startsWith('https://') && !bannerUrl.startsWith('http://')) {
      // Check if it's a simple relative path like /banner.png
      if (!bannerUrl.includes('cloudinary') && !bannerUrl.includes('res.')) {
        setMessage('⚠️ Warning: Relative paths like /banner.png must exist in the public folder. Use the upload button instead to auto-upload to Cloudinary.');
        return;
      }
    }

    setSaving(true);

    try {
      await axios.put(
        `${API_URL}/settings/banner`,
        { bannerImageUrl: bannerUrl, mobileBannerImageUrl: mobileBannerUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedUrl(bannerUrl);
      setSavedMobileUrl(mobileBannerUrl);
      setMessage('✅ Banner settings saved successfully.');
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
        Upload or set banner image URLs. <strong>Recommended:</strong> Use the upload buttons to directly upload to Cloudinary for guaranteed availability. Manual URLs must be fully accessible (http/https links or files in the public folder).
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
              <strong>How to use:</strong>
            </p>
            <ul style={{ fontSize: '0.95rem', color: '#6b7280', marginLeft: '16px' }}>
              <li>✅ <strong>Best option:</strong> Use "Upload" buttons → Images go to Cloudinary (reliable & fast)</li>
              <li>⚠️ Manual URL entry: Must be a full URL (https://example.com/banner.png) or file path in public folder (/banner.png)</li>
              <li>❌ Don't use relative paths like "/banner.png" unless the file actually exists in your public directory</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
