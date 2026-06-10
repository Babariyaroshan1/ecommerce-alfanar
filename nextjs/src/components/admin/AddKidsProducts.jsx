'use client';

import React, { useState, useRef } from 'react';
import axios from 'axios';
import { FaUndoAlt, FaExchangeAlt } from 'react-icons/fa';
import { useProductStore } from '@/store/productStore';
import './AddKidsProducts.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

const KIDS_SIZES = [
  '2Y',
  '3Y',
  '4Y',
  '5Y',
  '6Y',
  '7Y',
  '8Y',
  '9Y',
  '10Y',
  '12Y',
  'One Size',
];

export default function AddKidsProducts() {
  const mainImageInputRef = useRef(null);
  const quickImagesInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    image: null,
    images: [],
    kidsType: 'boys',
    customKidsType: '',
    colors: [],
    sizes: [],
    stock: {},
    allowReturn: false,
    allowReplacement: false,
  });

  const [colors, setColors] = useState(['']);
  const [imagePreview, setImagePreview] = useState(null);
  const [showMainImageUrlInput, setShowMainImageUrlInput] = useState(false);

  const [mainDragActive, setMainDragActive] = useState(false);
  const [quickDragActive, setQuickDragActive] = useState(false);
  const [quickImagesUploading, setQuickImagesUploading] = useState(false);

  const currencySettings = useProductStore((state) => state.currencySettings);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const setMainImageFile = (file) => {
    if (!file) return;

    setFormData((prev) => ({
      ...prev,
      image: file,
    }));

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleMainImageFileChange = (e) => {
    const file = e.target.files?.[0];
    setMainImageFile(file);
    if (e?.target) e.target.value = '';
  };

  const handleMainDrop = (e) => {
    e.preventDefault();
    setMainDragActive(false);

    const file = e.dataTransfer?.files?.[0];
    setMainImageFile(file);
  };

  const handleMainDragOver = (e) => {
    e.preventDefault();
    setMainDragActive(true);
  };

  const handleMainDragLeave = (e) => {
    e.preventDefault();
    setMainDragActive(false);
  };

  const uploadImageFile = async (file) => {
    const uploadForm = new FormData();
    uploadForm.append('file', file);

    const response = await axios.post(`${API_URL}/upload`, uploadForm, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  };

  const handleQuickImageFilesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setQuickImagesUploading(true);

    try {
      const uploadedUrls = [];

      for (const file of files) {
        const url = await uploadImageFile(file);
        uploadedUrls.push(url);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (error) {
      setMessageType('error');
      setMessage('Additional image upload failed.');
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

    setQuickImagesUploading(true);

    try {
      const uploadedUrls = [];

      for (const file of files) {
        const url = await uploadImageFile(file);
        uploadedUrls.push(url);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (error) {
      setMessageType('error');
      setMessage('Additional images upload failed.');
    } finally {
      setQuickImagesUploading(false);
    }
  };

  const handleQuickDragOver = (e) => {
    e.preventDefault();
    setQuickDragActive(true);
  };

  const handleQuickDragLeave = (e) => {
    e.preventDefault();
    setQuickDragActive(false);
  };

  const handleImageUrlChange = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, idx) => (idx === index ? value : img)),
    }));
  };

  const handleAddImageUrl = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ''],
    }));
  };

  const handleRemoveImageUrl = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  };

  const handleColorChange = (index, value) => {
    const newColors = [...colors];
    newColors[index] = value;
    setColors(newColors);
  };

  const addColorField = () => {
    setColors([...colors, '']);
  };

  const removeColorField = (index) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const toggleSize = (size) => {
    setFormData((prev) => {
      const hasSize = prev.sizes.includes(size);

      const nextSizes = hasSize
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];

      const nextStock = { ...prev.stock };

      if (hasSize) {
        delete nextStock[size];
      }

      return {
        ...prev,
        sizes: nextSizes,
        stock: nextStock,
      };
    });
  };

  const removeMainImage = () => {
    setImagePreview(null);

    setFormData((prev) => ({
      ...prev,
      image: null,
    }));
    setShowMainImageUrlInput(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      image: null,
      images: [],
      kidsType: 'boys',
      customKidsType: '',
      colors: [],
      sizes: [],
      stock: {},
      allowReturn: false,
      allowReplacement: false,
    });

    setColors(['']);
    setImagePreview(null);

    if (mainImageInputRef.current) {
      mainImageInputRef.current.value = '';
    }

    if (quickImagesInputRef.current) {
      quickImagesInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const missingFields = [];

    if (!formData.name.trim()) missingFields.push('Product Name');
    if (!formData.description.trim()) missingFields.push('Description');
    if (!formData.price) missingFields.push('Sale Price');
    if (!formData.image) missingFields.push('Product Image');

    if (missingFields.length > 0) {
      setMessageType('error');
      setMessage(`Please fill required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (formData.sizes.length === 0) {
      setMessageType('error');
      setMessage('Please select at least one size.');
      return;
    }

    const missingSizes = formData.sizes.filter(
      (size) =>
        formData.stock[size] === undefined ||
        formData.stock[size] === '' ||
        Number(formData.stock[size]) === 0
    );

    if (missingSizes.length > 0) {
      setMessageType('error');
      setMessage(`Please enter stock for: ${missingSizes.join(', ')}`);
      return;
    }

    let imageUrl = formData.image;
    const enteredPrice = Number(formData.price) || 0;
    const enteredOriginalPrice = formData.originalPrice
      ? Number(formData.originalPrice)
      : undefined;
    const activeCurrency = currencySettings?.currency || 'INR';

    let basePrice = enteredPrice;
    let baseOriginalPrice = enteredOriginalPrice;
    const pricesPayload = {};

    if (activeCurrency !== 'INR') {
      pricesPayload[activeCurrency] = enteredPrice;
      basePrice = convertToINR(enteredPrice, activeCurrency);

      if (enteredOriginalPrice !== undefined) {
        pricesPayload[`${activeCurrency}_original`] = enteredOriginalPrice;
        baseOriginalPrice = convertToINR(enteredOriginalPrice, activeCurrency);
      }
    }

    if (formData.image && typeof formData.image !== 'string') {
      try {
        imageUrl = await uploadImageFile(formData.image);
      } catch (uploadError) {
        setShowMainImageUrlInput(true);
        setMessageType('error');
        setMessage('Main image upload failed. You can paste an image URL instead.');
        return;
      }
    }

    const finalCategory =
      formData.kidsType === 'custom'
        ? formData.customKidsType || 'custom'
        : formData.kidsType;

    const requestData = {
      name: formData.name,
      description: formData.description,
      price: basePrice,
      prices: pricesPayload,
      originalPrice: baseOriginalPrice,
      category: 'kids',
      kidsType: finalCategory,
      colors: colors.filter(Boolean),
      sizes: formData.sizes,
      stock: formData.stock,
      images: formData.images.filter(Boolean),
      allowReturn: formData.allowReturn,
      allowReplacement: formData.allowReplacement,
      isKidsProduct: true,
      image: imageUrl,
    };

    try {
      setLoading(true);
      setMessage('');
      setMessageType('');

      const token = localStorage.getItem('adminToken');

      await axios.post(`${API_URL}/products`, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessageType('success');
      setMessage('Kids product added successfully!');

      resetForm();

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessageType('error');
      setMessage(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-kids-products-container">
      <div className="add-kids-header">
        <h1>Add Kids Product</h1>
        <p>Add new kids clothing, dresses, or accessories to your store</p>
      </div>

      {message && <div className={`message ${messageType}`}>{message}</div>}

      <form onSubmit={handleSubmit} className="add-kids-form">
        <div className="form-grid">
          <div className="form-section full-width">
            <label>Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Pink Kids Frock"
              required
            />
          </div>

          <div className="form-section full-width">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the kids product..."
              rows="4"
              required
            />
          </div>

          <div className="form-section">
            <label>Kids Type *</label>
            <select
              name="kidsType"
              value={formData.kidsType}
              onChange={handleInputChange}
              required
            >
              <option value="boys">Boys</option>
              <option value="girls">Girls</option>
              <option value="unisex">Unisex</option>
              <option value="baby">Baby</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {formData.kidsType === 'custom' && (
            <div className="form-section">
              <label>Custom Kids Type Name *</label>
              <input
                type="text"
                name="customKidsType"
                value={formData.customKidsType}
                onChange={handleInputChange}
                placeholder="e.g., Infants, Toddlers"
                required
              />
            </div>
          )}

          <div className="form-section">
            <label>Sale Price (KWD) *</label>
            <input
              type="number"
              name="price"
              step="0.001"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="e.g., 5.990"
              required
            />
          </div>

          <div className="form-section">
            <label>Original Price (KWD)</label>
            <input
              type="number"
              name="originalPrice"
              step="0.001"
              value={formData.originalPrice}
              onChange={handleInputChange}
              placeholder="e.g., 9.990"
            />
          </div>

          <div className="form-section full-width">
            <label>Policies</label>

            <div className="policy-box">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="allowReturn"
                  checked={formData.allowReturn}
                  onChange={handleInputChange}
                />
                <span className="policy-icon-text">
                  <FaUndoAlt className="policy-icon" />
                  Return Available
                </span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="allowReplacement"
                  checked={formData.allowReplacement}
                  onChange={handleInputChange}
                />
                <span className="policy-icon-text">
                  <FaExchangeAlt className="policy-icon" />
                  Replacement Available
                </span>
              </label>
            </div>
          </div>

          <div className="form-section full-width">
            <label>Main Product Image *</label>

            <div
              className={`image-drop-zone ${mainDragActive ? 'drag-active' : ''}`}
              onDragOver={handleMainDragOver}
              onDragEnter={handleMainDragOver}
              onDragLeave={handleMainDragLeave}
              onDrop={handleMainDrop}
              onClick={() => mainImageInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMainImage();
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="drop-content">
                  <div className="upload-icon"></div>
                  <p>Drag & drop main image here, or click to browse</p>
                  <small>JPEG, PNG, WebP up to 5MB</small>
                </div>
              )}

              <input
                ref={mainImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleMainImageFileChange}
                hidden
              />
            </div>

            <div className="manual-url-section">
              <button
                type="button"
                className="manual-url-btn"
                onClick={() => {
                  setShowMainImageUrlInput((prev) => !prev);
                  if (!showMainImageUrlInput) {
                    setFormData((prev) => ({
                      ...prev,
                      image: typeof prev.image === 'object' ? '' : prev.image,
                    }));
                  }
                }}
              >
                {showMainImageUrlInput ? 'Hide Image URL' : 'Add Image URL'}
              </button>
            </div>

            {showMainImageUrlInput && (
              <div className="form-section">
                <label>Main Image URL</label>
                <input
                  type="url"
                  value={typeof formData.image === 'string' ? formData.image : ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      image: e.target.value,
                    }))
                  }
                  placeholder="Paste image URL here"
                />
              </div>
            )}
          </div>

          <div className="form-section full-width">
            <label>Additional Product Images</label>

            <div className="quick-view-images-inputs">
              {formData.images.map((imageUrl, index) => (
                <div key={index} className="quick-view-image-row">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => handleImageUrlChange(index, e.target.value)}
                    placeholder={`Image URL ${index + 1}`}
                  />

                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={`Preview ${index + 1}`}
                      className="quick-image-preview"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveImageUrl(index)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div
                className={`quick-drop-zone ${quickDragActive ? 'drag-active' : ''}`}
                onDragOver={handleQuickDragOver}
                onDragEnter={handleQuickDragOver}
                onDragLeave={handleQuickDragLeave}
                onDrop={handleQuickDrop}
                onClick={() => quickImagesInputRef.current?.click()}
              >
                <div className="drop-content small">
                  <p>Drag & drop extra images here, or click to browse</p>
                  <small>You can also paste image URLs below</small>
                </div>

                <input
                  ref={quickImagesInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleQuickImageFilesChange}
                  hidden
                />
              </div>

              <button
                type="button"
                onClick={handleAddImageUrl}
                className="add-image-btn"
              >
                + Add Image URL
              </button>

              {quickImagesUploading && (
                <p className="uploading-text">Uploading images...</p>
              )}
            </div>
          </div>

          <div className="form-section full-width">
            <label>Color</label>

            {colors.map((color, index) => (
              <div key={index} className="color-input-group">
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  placeholder="e.g., Pink, Blue, White"
                />

                {colors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeColorField(index)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <button type="button" onClick={addColorField} className="add-color-btn">
              Add Color
            </button>
          </div>

          <div className="form-section full-width">
            <label>Size *</label>

            <div className="sizes-selector">
              {KIDS_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`size-btn ${
                    formData.sizes.includes(size) ? 'selected' : ''
                  }`}
                  onClick={() => toggleSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>

            {formData.sizes.length === 0 && (
              <p className="form-error">Select at least one size</p>
            )}
          </div>

          {formData.sizes.length > 0 && (
            <div className="form-section full-width">
              <label>Stock per Size *</label>

              <div className="stock-per-size">
                {formData.sizes.map((size) => (
                  <div key={size} className="stock-input-group">
                    <label>{size}</label>

                    <input
                      type="number"
                      min="0"
                      value={
                        formData.stock[size] !== undefined
                          ? formData.stock[size]
                          : ''
                      }
                      onChange={(e) => {
                        const value =
                          e.target.value === '' ? '' : Number(e.target.value);

                        setFormData((prev) => ({
                          ...prev,
                          stock: {
                            ...prev.stock,
                            [size]: value,
                          },
                        }));
                      }}
                      placeholder="0"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Adding...' : 'Add Kids Product'}
        </button>
      </form>
    </div>
  );
}