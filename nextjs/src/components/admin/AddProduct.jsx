'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useProductStore } from '@/store/productStore';
import NotificationModal from '@/components/NotificationModal';
import './AddProduct.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const GENERAL_FEATURED_LIMIT = 8;
const KIDS_FEATURED_LIMIT = 4;

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'KWD', symbol: 'KWD', name: 'Kuwaiti Dinar' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
];

const CURRENCY_RATES = {
  INR: 1,
  KWD: 0.0037,
  USD: 0.012,
};

const convertToINR = (amount, currency) => {
  const rate = CURRENCY_RATES[currency] || 1;
  if (rate === 0) return Number(amount);
  return Number((Number(amount) / rate).toFixed(2));
};

const DEFAULT_CATEGORIES = ['Midi', 'Maxi','Pajamas','Kurti', 'Gown'];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Free'];
const CUSTOM_CATEGORIES_STORAGE_KEY = 'noor_custom_categories';

const AddProduct = () => {
  const addLocalProduct = useProductStore((state) => state.addLocalProduct);
  const currencySettings = useProductStore((state) => state.currencySettings);
  const products = useProductStore((state) => state.products);

  const loadSavedCategories = () => {
    try {
      const saved = localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading saved categories:', e);
      return [];
    }
  };

  const [categories, setCategories] = useState(() => [
    ...DEFAULT_CATEGORIES,
    ...loadSavedCategories()
  ]);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    materialAndCare: '',
    countryOfOrigin: '',
    price: '',
    prices: {},
    originalPrice: '',
    category: '',
    colors: [''],
    sizes: [],
    stock: {},
    image: '',
    images: [],
    allowReturn: false,
    allowReplacement: false,
    isNew: false,
    isFeaturedOnHome: false,
    showSimilarProductButton: false,
    similarProducts: '',
  });

  const mainImageInputRef = useRef(null);
  const quickImagesInputRef = useRef(null);

  const [imagePreview, setImagePreview] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [quickImagesUploading, setQuickImagesUploading] = useState(false);
  const [mainDragActive, setMainDragActive] = useState(false);
  const [quickDragActive, setQuickDragActive] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationType, setNotificationType] = useState('success');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'image') setImagePreview(value);
  };

  const uploadImageFile = async (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Allowed: JPG, PNG, WebP, GIF`);
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File too large. Max 5MB allowed.');
    }

    const uploadForm = new FormData();
    uploadForm.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/upload`, uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000 
      });
      return response.data.url;
    } catch (error) {
      const backendError = error.response?.data?.message || error.response?.data?.error || error.message;
      throw new Error(backendError);
    }
  };

  const handleMainImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const uploadedUrl = await uploadImageFile(file);
      setFormData((prev) => ({ ...prev, image: uploadedUrl }));
      setImagePreview(uploadedUrl);
      setSuccessMessage('Main image uploaded successfully');
      setNotificationType('success');
      setNotificationOpen(true);
    } catch (error) {
      setErrorMessage(error.message || 'Main image upload failed');
      setNotificationType('error');
      setNotificationOpen(true);
    } finally {
      setImageUploading(false);
      if (e?.target) e.target.value = '';
    }
  };

  const handleMainDrop = async (e) => {
    e.preventDefault();
    setMainDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const uploadedUrl = await uploadImageFile(file);
      setFormData((prev) => ({ ...prev, image: uploadedUrl }));
      setImagePreview(uploadedUrl);
      setSuccessMessage('Main image uploaded successfully');
      setNotificationType('success');
      setNotificationOpen(true);
    } catch (error) {
      setErrorMessage(error.message || 'Main image upload failed');
      setNotificationType('error');
      setNotificationOpen(true);
    } finally {
      setImageUploading(false);
    }
  };

  const handleMainDragOver = (e) => { e.preventDefault(); setMainDragActive(true); };
  const handleMainDragLeave = (e) => { e.preventDefault(); setMainDragActive(false); };

  const handleQuickImageFilesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setQuickImagesUploading(true);

    try {
      const uploadedUrls = [];
      const failedUploads = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const url = await uploadImageFile(files[i]);
          uploadedUrls.push(url);
        } catch (error) {
          failedUploads.push({ filename: files[i].name, error: error.message || 'Unknown error' });
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      }
      if (failedUploads.length > 0) {
        const failedList = failedUploads.map(f => `${f.filename}: ${f.error}`).join('\n');
        setErrorMessage(`Failed to upload ${failedUploads.length} image(s):\n${failedList}`);
        setNotificationType('error');
        setNotificationOpen(true);
      }
      if (uploadedUrls.length > 0 && failedUploads.length === 0) {
        setSuccessMessage(`Successfully uploaded ${uploadedUrls.length} image(s)`);
        setNotificationType('success');
        setNotificationOpen(true);
      }
    } catch (error) {
      setErrorMessage(`Upload error: ${error.message}`);
      setNotificationType('error');
      setNotificationOpen(true);
    } finally {
      setQuickImagesUploading(false);
      if (e?.target) e.target.value = '';
    }
  };

  const handleQuickDrop = async (e) => {
    e.preventDefault();
    setQuickDragActive(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length === 0) return;
    const limited = files.slice(0, 2);
    setQuickImagesUploading(true);

    try {
      const uploadedUrls = [];
      const failedUploads = [];
      for (let i = 0; i < limited.length; i++) {
        try {
          const url = await uploadImageFile(limited[i]);
          uploadedUrls.push(url);
        } catch (error) {
          failedUploads.push({ filename: limited[i].name, error: error.message || 'Unknown error' });
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      }
      if (failedUploads.length > 0) {
        const failedList = failedUploads.map(f => `${f.filename}: ${f.error}`).join('\n');
        setErrorMessage(`Failed to upload:\n${failedList}`);
        setNotificationType('error');
        setNotificationOpen(true);
      }
    } catch (error) {
      setErrorMessage(`Upload error: ${error.message}`);
      setNotificationType('error');
      setNotificationOpen(true);
    } finally {
      setQuickImagesUploading(false);
    }
  };

  const handleQuickDragOver = (e) => { e.preventDefault(); setQuickDragActive(true); };
  const handleQuickDragLeave = (e) => { e.preventDefault(); setQuickDragActive(false); };

  const handlePriceChange = (currency, value, type = 'price') => {
    const fieldKey = type === 'original' ? `${currency}_original` : currency;
    setFormData((prev) => ({
      ...prev,
      prices: { ...(prev.prices || {}), [fieldKey]: value ? Number(value) : undefined },
    }));
  };

  const handleAddCategory = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const isCustom = !DEFAULT_CATEGORIES.includes(trimmed);
    
    setCategories((prev) => {
      if (!prev.includes(trimmed)) {
        const updated = [...prev, trimmed];
        if (isCustom) {
          const customCats = updated.filter(cat => !DEFAULT_CATEGORIES.includes(cat));
          try { localStorage.setItem(CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(customCats)); } catch (e) {}
        }
        return updated;
      }
      return prev;
    });
    setFormData((prev) => ({ ...prev, category: trimmed }));
    setShowCustomCategory(false);
  };

  const handleDeleteCategory = (category) => {
    setCategories((prev) => {
      const updated = prev.filter((item) => item !== category);
      const isCustom = !DEFAULT_CATEGORIES.includes(category);
      if (isCustom) {
        const customCats = updated.filter(cat => !DEFAULT_CATEGORIES.includes(cat));
        try { localStorage.setItem(CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(customCats)); } catch (e) {}
      }
      return updated;
    });
    setFormData((prev) => ({ ...prev, category: prev.category === category ? '' : prev.category }));
  };

  const handleColorChange = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.map((color, idx) => (idx === index ? value : color)),
    }));
  };

  const handleAddColor = () => setFormData((prev) => ({ ...prev, colors: [...prev.colors, ''] }));
  const handleRemoveColor = (index) => setFormData((prev) => ({ ...prev, colors: prev.colors.filter((_, idx) => idx !== index) }));

 const handleSizeChange = (size) => {
    setFormData((prev) => {
      const isSelected = prev.sizes.includes(size);
      const newSizes = isSelected
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];

      // Unselect karne par purana stock data clear kar dega
      const newStock = { ...prev.stock };
      if (isSelected) {
        delete newStock[size];
      }

      return {
        ...prev,
        sizes: newSizes,
        stock: newStock
      };
    });
  };

  const handleImageUrlChange = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, idx) => (idx === index ? value : img)),
    }));
  };

  const handleAddImageUrl = () => setFormData((prev) => ({ ...prev, images: [...prev.images, ''] }));
  const handleRemoveImageUrl = (index) => setFormData((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== index) }));

  const resetForm = () => {
    setFormData({
      name: '', description: '', materialAndCare: '', countryOfOrigin: '', price: '', prices: {},
      originalPrice: '', category: '', colors: [''], sizes: [], stock: {}, image: '', images: [],
      allowReturn: false, allowReplacement: false, isNew: false, isFeaturedOnHome: false,
      showSimilarProductButton: false, similarProducts: '',
    });
    setImagePreview('');
    setShowCustomCategory(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setErrorMessage(''); setSuccessMessage('');

    if (!formData.name.trim()) { setErrorMessage('Product name is required'); setNotificationType('error'); setNotificationOpen(true); setLoading(false); return; }
    if (!formData.price) { setErrorMessage('Price is required'); setNotificationType('error'); setNotificationOpen(true); setLoading(false); return; }
    if (!formData.category) { setErrorMessage('Category is required'); setNotificationType('error'); setNotificationOpen(true); setLoading(false); return; }
    if (!formData.colors.some((color) => color.trim())) { setErrorMessage('At least one color is required'); setNotificationType('error'); setNotificationOpen(true); setLoading(false); return; }
    if (formData.sizes.length === 0) { setErrorMessage('Select at least one size'); setNotificationType('error'); setNotificationOpen(true); setLoading(false); return; }

    const imagesToSubmit = formData.images.filter(Boolean);

    try {
      const token = localStorage.getItem('adminToken');
      const activeCurrency = currencySettings?.currency || 'INR';

      const enteredPrice = Number(formData.price) || 0;
      const enteredOriginalPrice = formData.originalPrice ? Number(formData.originalPrice) : undefined;
      const pricesPayload = { ...formData.prices };

      let basePrice = enteredPrice;
      let baseOriginalPrice = enteredOriginalPrice;

      if (activeCurrency !== 'INR') {
        pricesPayload[activeCurrency] = enteredPrice;
        basePrice = convertToINR(enteredPrice, activeCurrency);
        if (enteredOriginalPrice !== undefined) {
          pricesPayload[`${activeCurrency}_original`] = enteredOriginalPrice;
          baseOriginalPrice = convertToINR(enteredOriginalPrice, activeCurrency);
        }
      }

      const totalFeaturedCount = products.filter(p => p.isFeaturedOnHome === true || p.isFeaturedOnHome === 'true').length;
      const kidsFeaturedCount = products.filter(p => (p.isFeaturedOnHome === true || p.isFeaturedOnHome === 'true') && p.isKidsProduct).length;
      const generalFeaturedCount = totalFeaturedCount - kidsFeaturedCount;
      const isKidsNew = String(formData.category || '').toLowerCase().includes('kid');

      if (formData.isFeaturedOnHome) {
        if (isKidsNew) {
          if (kidsFeaturedCount >= KIDS_FEATURED_LIMIT) {
            setErrorMessage(`You can only mark up to ${KIDS_FEATURED_LIMIT} kids products as featured.`);
            setNotificationType('error'); setNotificationOpen(true); setLoading(false); return;
          }
        } else {
          if (generalFeaturedCount >= GENERAL_FEATURED_LIMIT) {
            setErrorMessage(`You can only mark up to ${GENERAL_FEATURED_LIMIT} products as featured.`);
            setNotificationType('error'); setNotificationOpen(true); setLoading(false); return;
          }
        }
      }

      const submitPayload = {
        ...formData,
        price: basePrice, prices: pricesPayload, originalPrice: baseOriginalPrice,
        colors: formData.colors.filter(Boolean), images: imagesToSubmit,
        isFeaturedOnHome: Boolean(formData.isFeaturedOnHome),
        showSameColorButton: Boolean(formData.showSimilarProductButton),
        similarProducts: formData.similarProducts.split(',').map((id) => id.trim()).filter(Boolean),
        materialAndCare: formData.materialAndCare?.trim() || '',
        countryOfOrigin: formData.countryOfOrigin?.trim() || '',
      };

      const response = await axios.post(`${API_URL}/products`, submitPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMessage('Product added successfully!');
      setNotificationType('success'); setNotificationOpen(true);
      resetForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      const localProduct = {
        _id: Date.now().toString(), ...formData,
        price: Number(formData.price), originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        colors: formData.colors.filter(Boolean), images: formData.images.filter(Boolean),
        materialAndCare: formData.materialAndCare?.trim() || '', countryOfOrigin: formData.countryOfOrigin?.trim() || '',
        createdAt: new Date().toISOString(),
      };

      try {
        addLocalProduct(localProduct);
        setSuccessMessage('Product added locally. Backend unavailable.');
        setNotificationType('success'); setNotificationOpen(true);
        resetForm();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (localError) {
        setErrorMessage(error.response?.data?.message || 'Failed to add product');
        setNotificationType('error'); setNotificationOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-container">
      <div className="add-product-header">
        <h1>Add New Product</h1>
      </div>

      <NotificationModal
        message={notificationType === 'success' ? successMessage : errorMessage}
        type={notificationType}
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-section full-width">
          <h3>Basic Details</h3>
          <div className="form-grid two-col">
            <div className="form-group">
              <label>Product Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter product name" required />
            </div>

            <div className="form-group category-group">
              <label>Category *</label>
              <div className="category-input-row">
                <div className="custom-select-wrapper" ref={dropdownRef}>
                  <div className={`custom-select-trigger ${!formData.category ? 'placeholder' : ''}`} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                    {formData.category || 'Select Category'}
                    <span>▼</span>
                  </div>
                  {isDropdownOpen && (
                    <div className="custom-select-options">
                      {categories.map((category) => (
                        <div key={category} className="custom-select-option">
                          <span className="cat-text" onClick={() => { setFormData((prev) => ({ ...prev, category })); setShowCustomCategory(false); setIsDropdownOpen(false); }}>
                            {category}
                          </span>
                          <button type="button" className="delete-cat-dropdown-btn" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category); }}>×</button>
                        </div>
                      ))}
                      <div className="custom-select-option custom-option-add" onClick={() => { setShowCustomCategory(true); setFormData((prev) => ({ ...prev, category: '' })); setIsDropdownOpen(false); }}>
                        + Custom Category
                      </div>
                    </div>
                  )}
                </div>
                <button type="button" className="custom-category-btn" onClick={() => { setShowCustomCategory(true); setFormData((prev) => ({ ...prev, category: '' })); }}>
                  Custom
                </button>
              </div>
              {showCustomCategory && (
                <div className="custom-category-row">
                  <input type="text" value={formData.category} onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))} placeholder="Enter custom category" />
                  <button type="button" className="add-category-btn" onClick={() => handleAddCategory(formData.category)}>Add</button>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Enter product description" rows="5" />
          </div>

          <div className="form-grid two-col">
            <div className="form-group">
              <label>Material & Care (Optional)</label>
              <textarea name="materialAndCare" value={formData.materialAndCare} onChange={handleChange} placeholder="e.g., 100% Cotton. Wash in cold water. Do not bleach." rows="3" />
            </div>
            <div className="form-group">
              <label>Country of Origin (Optional)</label>
              <input type="text" name="countryOfOrigin" value={formData.countryOfOrigin} onChange={handleChange} placeholder="e.g., India" />
            </div>
          </div>
        </div>

        <div className="form-section full-width">
          <h3>Price Details</h3>
          <div className="form-grid two-col">
            <div className="form-group">
              <label>Price ({currencySettings?.symbol || '₹'}) *</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.000" step="0.001" min="0" required />
            </div>
            <div className="form-group">
              <label>Original Price ({currencySettings?.symbol || '₹'})</label>
              <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} placeholder="Optional old price" step="0.001" min="0" />
            </div>
          </div>
        </div>

        <div className="form-section full-width">
          <div className="price-settings-row">
            <div className="price-box">
              <h3>Multi-Currency Prices Optional</h3>
              <div className="compact-currency-grid">
                {CURRENCIES.map((currency) => (
                  <div key={currency.code} className="currency-card">
                    <label>{currency.symbol} {currency.name} Price</label>
                    <input type="number" value={formData.prices?.[currency.code] || ''} onChange={(e) => handlePriceChange(currency.code, e.target.value)} placeholder={`Price in ${currency.code}`} step="0.001" min="0" />
                    <label>{currency.symbol} {currency.name} Original Price</label>
                    <input type="number" value={formData.prices?.[`${currency.code}_original`] || ''} onChange={(e) => handlePriceChange(currency.code, e.target.value, 'original')} placeholder={`Original price in ${currency.code}`} step="0.001" min="0" />
                  </div>
                ))}
              </div>
            </div>

            <div className="settings-box">
              <h3>Product Settings</h3>
              <div className="compact-toggle-row">
                <div className="toggle-switch-container">
                  <label className="toggle-switch">
                    <input type="checkbox" checked={formData.allowReturn} onChange={() => setFormData((prev) => ({ ...prev, allowReturn: !prev.allowReturn }))} />
                    <span className="toggle-switch-ord "></span>
                  </label>
                  <span className="toggle-label">{formData.allowReturn ? '↩ Return Available' : '↩ Return Not Available'}</span>
                </div>
                <div className="toggle-switch-container">
                  <label className="toggle-switch">
                    <input type="checkbox" checked={formData.allowReplacement} onChange={() => setFormData((prev) => ({ ...prev, allowReplacement: !prev.allowReplacement }))} />
                    <span className="toggle-switch-ord "></span>
                  </label>
                  <span className="toggle-label">{formData.allowReplacement ? <><i className="fa-solid fa-repeat"></i> Replacement Available</> : <><i className="fa-solid fa-repeat"></i> Replacement Not Available</>}</span>
                </div>
                <div className="toggle-switch-container">
                  <label className="toggle-switch">
                    <input type="checkbox" checked={formData.isNew} onChange={() => setFormData((prev) => ({ ...prev, isNew: !prev.isNew }))} />
                    <span className="toggle-switch-ord "></span>
                  </label>
                  <span className="toggle-label">{formData.isNew ? <><i className="fa-solid fa-star"></i> Marked as New Arrival</> : 'Mark as New Arrival'}</span>
                </div>
                <div className="toggle-switch-container">
                  <label className="toggle-switch">
                    <input type="checkbox" checked={formData.isFeaturedOnHome} onChange={() => setFormData((prev) => ({ ...prev, isFeaturedOnHome: !prev.isFeaturedOnHome }))} />
                    <span className="toggle-switch-ord "></span>
                  </label>
                  <span className="toggle-label">{formData.isFeaturedOnHome ? <><i className="fa-solid fa-star"></i> Featured on Home Page</> : 'Feature on Home Page'}</span>
                </div>
                <div className="toggle-switch-container">
                  <label className="toggle-switch">
                    <input type="checkbox" checked={formData.showSimilarProductButton} onChange={() => setFormData((prev) => ({ ...prev, showSimilarProductButton: !prev.showSimilarProductButton }))} />
                    <span className="toggle-switch-ord "></span>
                  </label>
                  <span className="toggle-label">{formData.showSimilarProductButton ? <><i className="fa-solid fa-palette"></i> Show Same Color Button</> : 'Hide Same Color Button'}</span>
                </div>
              </div>
              {formData.showSimilarProductButton && (
                <div className="form-group similar-products-input">
                  <label>Similar Product IDs comma-separated</label>
                  <input type="text" name="similarProducts" value={formData.similarProducts} onChange={handleChange} placeholder="e.g., 64a1b2c3d4e5f6789" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-section full-width">
          <h3>Images</h3>
          <div className="form-grid two-col">
            <div className="form-group">
              <label>Main Product Image</label>
              <div className={`image-drop-zone ${mainDragActive ? 'drag-active' : ''}`} onDragOver={handleMainDragOver} onDragEnter={handleMainDragOver} onDragLeave={handleMainDragLeave} onDrop={handleMainDrop} onClick={() => mainImageInputRef.current?.click()}>
                {imageUploading ? <div className="uploading-text">Uploading...</div> : formData.image ? <img src={imagePreview || formData.image} alt="Main Preview" className="main-image-preview" /> : <div className="drop-hint">Drag & drop main image here, or click to browse</div>}
                <input ref={mainImageInputRef} type="file" accept="image/*" onChange={handleMainImageFileChange} style={{ display: 'none' }} />
              </div>
              <input type="text" name="image" value={formData.image} onChange={handleChange} placeholder="Or paste image URL here" />
            </div>

            <div className="form-group">
              <label>Quick View Images</label>
              <div className="quick-view-images-inputs">
                {formData.images.map((imageUrl, index) => (
                  <div key={index} className="quick-view-image-row">
                    <input type="text" value={imageUrl} onChange={(e) => handleImageUrlChange(index, e.target.value)} placeholder={`Image URL ${index + 1}`} />
                    {imageUrl && <img src={imageUrl} alt={`Preview ${index + 1}`} className="quick-image-preview" />}
                    <button type="button" className="remove-image-btn" onClick={() => handleRemoveImageUrl(index)}>Remove</button>
                  </div>
                ))}
                <button type="button" className="add-image-btn" onClick={handleAddImageUrl}>+ Add Image URL</button>
              </div>
              <div className={`quick-drop-zone ${quickDragActive ? 'drag-active' : ''}`} onDragOver={handleQuickDragOver} onDragEnter={handleQuickDragOver} onDragLeave={handleQuickDragLeave} onDrop={handleQuickDrop} onClick={() => quickImagesInputRef.current?.click()}>
                {quickImagesUploading ? <div className="uploading-text">Uploading...</div> : <div className="drop-hint">Drag & drop image files here, or click to browse (Max 2 images per upload)</div>}
                <input ref={quickImagesInputRef} type="file" multiple accept="image/*" onChange={handleQuickImageFilesChange} style={{ display: 'none' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================== 
            NEW LAYOUT FOR COLORS & SIZES 
            ==================================================== */}
        <div className="form-section full-width">
          <h3>Colors & Sizes</h3>
          <div className="form-grid two-col">
            
            {/* Left Column: Colors */}
            <div className="form-group colors-group">
              <label>Product Colors</label>
              <div className="color-rows">
                {formData.colors.map((color, index) => (
                  <div key={index} className="color-row-item">
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      placeholder="e.g. Red, #FF0000"
                    />
                    <input
                      type="color"
                      value={color.startsWith('#') ? color : '#000000'}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className="color-picker-input"
                    />
                    {formData.colors.length > 1 && (
                      <button
                        type="button"
                        className="remove-color-btn"
                        onClick={() => handleRemoveColor(index)}
                      >
                        ✖
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-color-btn"
                  onClick={handleAddColor}
                >
                  + Add Color
                </button>
              </div>
            </div>

            {/* Right Column: Sizes (As Fillable Buttons) */}
            <div className="form-group sizes-group">
              <label>Available Sizes</label>
              <div className="sizes-button-container">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`custom-size-btn ${formData.sizes.includes(size) ? 'selected' : ''}`}
                    onClick={() => handleSizeChange(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ==================================================== 
            STOCK (SMALL & COMPACT) - ONLY SHOWS IF SIZES SELECTED
            ==================================================== */}
        {formData.sizes.length > 0 && (
          <div className="form-section full-width">
            <h3>Stock Per Size</h3>
            <div className="stock-per-size-row-compact">
              {formData.sizes.map((size) => (
                <div key={size} className="compact-stock-input">
                  <label>{size}</label>
                  <input
                    type="number"
                    value={formData.stock[size] ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        stock: {
                          ...prev.stock,
                          [size]: value === '' ? '' : Number(value),
                        },
                      }));
                    }}
                    placeholder="0"
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-section full-width">
          <div className="form-actions">
            <button type="submit"style={{backgroundColor: 'black'}} className="submit-btn" disabled={loading}>
              {loading ? 'Adding Product...' : 'Add Product'}
            </button>
            <button
              type="button"
              className="reset-btn"
              onClick={resetForm}
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;