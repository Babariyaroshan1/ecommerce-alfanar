'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useProductStore } from '../../store/productStore';
import './ProductList.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production
const GENERAL_FEATURED_LIMIT = 8;
const KIDS_FEATURED_LIMIT = 4;

const PREDEFINED_COLORS =[
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#00AA00' },
  { name: 'Brown', hex: '#A52A2A' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Orange', hex: '#FFA500' },
];

const DEFAULT_CATEGORIES = ['Pajamas', 'Midi', 'Maxi'];
const CUSTOM_CATEGORIES_STORAGE_KEY = 'noor_custom_categories';

const loadSavedCategories = () => {
  try {
    const saved = localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Error loading saved categories:', e);
    return [];
  }
};

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Free'];
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

const getSizesForCategory = (category) => {
  if (category === 'kids') {
    return KIDS_SIZES;
  }
  return SIZES;
};

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'KWD', symbol: 'KWD', name: 'Kuwaiti Dinar' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  // { code: 'GBP', symbol: '£', name: 'British Pound' },
  // { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  // { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  // { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  // { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  // { code: 'EUR', symbol: '€', name: 'Euro' }
];

const CURRENCY_RATES = {
  INR: 1,
  KWD: 0.0037,
  USD: 0.012,
  GBP: 0.0096,
  AED: 0.044,
  SAR: 0.045,
  PKR: 3.0,
  BDT: 1.3,
  EUR: 0.011
};

const convertFromINR = (amount, currency) => {
  const rate = CURRENCY_RATES[currency] || 1;
  const converted = Number(amount) * rate;
  return Number(converted.toFixed(currency === 'KWD' ? 3 : 2));
};

const convertToINR = (amount, currency) => {
  const rate = CURRENCY_RATES[currency] || 1;
  if (rate === 0) return Number(amount);
  return Number((Number(amount) / rate).toFixed(2));
};

const ProductList = ({ role = 'admin', permissions = [] }) => {
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const products = useProductStore((state) => state.products);
  const deleteProduct = useProductStore((state) => state.deleteProduct);
  const updateProduct = useProductStore((state) => state.updateProduct);
  const currencySettings = useProductStore((state) => state.currencySettings);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [editingProductId, setEditingProductId] = useState(null);
  
  // Load saved custom categories
  const [defaultCategories, setDefaultCategories] = useState(() => [
    ...DEFAULT_CATEGORIES,
    ...loadSavedCategories()
  ]);
  
  // Granular permission checks
  const isAdmin = role === 'admin';
  const canViewProducts = isAdmin || permissions.includes('view_products');
  const canAddProducts = isAdmin || permissions.includes('add_products');
  const canEditProducts = isAdmin || permissions.includes('edit_products');
  const canDeleteProducts = isAdmin || permissions.includes('delete_products');
  const isCoAdmin = role === 'coadmin';
  const isViewOnlyCoAdmin = isCoAdmin && canViewProducts && !canEditProducts && !canAddProducts && !canDeleteProducts;
  
  const[editValues, setEditValues] = useState({
    name: '',
    category: '',
    customCategory: '',
    showCustomCategory: false,
    price: '',
    prices: {},
    originalPrice: '',
    stock: {},
    rating: '',
    description: '',
    materialAndCare: '',
    countryOfOrigin: '',
    image: '',
    images: [],
    colors: [''],
    sizes:[],
    allowReturn: false,
    allowReplacement: false,
    isNew: false,
    isFeaturedOnHome: false,
    showSimilarProductButton: false,
    similarProducts: '',
    isKidsProduct: false,
    kidsType: '',
    customKidsType: ''
  });
  const[savingId, setSavingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const[successMessage, setSuccessMessage] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [detailedPreviewOpen, setDetailedPreviewOpen] = useState(false);
  const [detailedPreviewProduct, setDetailedPreviewProduct] = useState(null);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState('');
  const [fullScreenImageOpen, setFullScreenImageOpen] = useState(false);

  const openPreview = (url) => {
    if (!url) return;
    setPreviewImageUrl(url);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewImageUrl('');
  };

  const openDetailedPreview = (product) => {
    setDetailedPreviewProduct(product);
    setDetailedPreviewOpen(true);
  };

  const closeDetailedPreview = () => {
    setDetailedPreviewOpen(false);
    setDetailedPreviewProduct(null);
    setFullScreenImageOpen(false);
    setFullScreenImageUrl('');
  };

  const openFullScreenImage = (url) => {
    setFullScreenImageUrl(url);
    setFullScreenImageOpen(true);
  };

  const closeFullScreenImage = () => {
    setFullScreenImageOpen(false);
    setFullScreenImageUrl('');
  };

  // Fetch products from API on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter only database products (those with _id)
  const dbProducts = products.filter(p => p._id);
  
  const isKidsProduct = (product) => {
    const category = String(product.category || '').toLowerCase();
    return product.isKidsProduct === true || ['boys', 'girls'].includes(category);
  };

  const availableCategoryFilters = [
    'all',
    'kids',
    ...Array.from(
      new Set(
        [
          ...defaultCategories,
          ...dbProducts.map((product) => String(product.category || '').trim()),
        ]
          .filter(Boolean)
          .map((category) => category)
      )
    ).filter((category) => category.toLowerCase() !== 'kids' && category.toLowerCase() !== 'all')
  ];

  const filteredProducts = dbProducts
    .filter((product) => {
      if (filterMode === 'all') return true;
      if (filterMode === 'kids') return isKidsProduct(product);
      return String(product.category || '').toLowerCase() === String(filterMode).toLowerCase();
    })
    .filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getStockTotal = (stock) => {
    if (!stock) return 0;
    if (stock instanceof Map) {
      return Array.from(stock.values()).reduce((sum, value) => sum + Number(value || 0), 0);
    }
    if (typeof stock === 'object' && !Array.isArray(stock)) {
      return Object.values(stock).reduce((sum, value) => sum + Number(value || 0), 0);
    }
    return Number(stock || 0);
  };

  const formatAdminPrice = (price, currencySymbol, currencyCode) => {
    const numeric = Number(price || 0);
    if (currencyCode === 'KWD') {
      return `${currencySymbol || 'KWD'}${numeric.toFixed(3)}`;
    }
    return `${currencySymbol || '₹'}${numeric}`;
  };

  const formatCurrencyInputValue = (value, currencyCode) => {
    if (value === undefined || value === null || value === '') return '';
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return String(value);
    return currencyCode === 'KWD' ? numeric.toFixed(3) : String(value);
  };

  const normalizeImageUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    const trimmed = url.trim();
    if (!trimmed.includes('drive.google.com')) {
      return trimmed;
    }

    if (trimmed.includes('drive.google.com/uc?export=view') || trimmed.includes('drive.google.com/uc?export=download')) {
      return trimmed;
    }

    const fileIdMatch = trimmed.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{10,})/);
    const fileId = fileIdMatch ? fileIdMatch[1] : null;
    if (!fileId) {
      return trimmed;
    }

    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  };

  const normalizeFeatured = (value) =>
    value === true ||
    value === 'true' ||
    value === '1' ||
    value === 1;

  const handleToggleFeatured = async (product) => {
    console.log('[FEATURED] Clicked for:', product.name);

    const currentlyFeatured = normalizeFeatured(product.isFeaturedOnHome);
    const totalFeaturedCount = products.filter((p) => normalizeFeatured(p.isFeaturedOnHome)).length;
    const kidsFeaturedCount = products.filter((p) => normalizeFeatured(p.isFeaturedOnHome) && p.isKidsProduct).length;
    const generalFeaturedCount = totalFeaturedCount - kidsFeaturedCount;

    if (!currentlyFeatured) {
      if (product.isKidsProduct && kidsFeaturedCount >= KIDS_FEATURED_LIMIT) {
        alert(`You can only mark up to ${KIDS_FEATURED_LIMIT} kids products as featured. To increase this limit, update the code.`);
        return;
      }
      if (!product.isKidsProduct && generalFeaturedCount >= GENERAL_FEATURED_LIMIT) {
        alert(`You can only mark up to ${GENERAL_FEATURED_LIMIT} general products as featured. To increase this limit, update the code.`);
        return;
      }
    }

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Admin authorization is required to change featured status. Please log in again.');
        return;
      }

      const newFeaturedState = !currentlyFeatured;
      let updatedProduct = { ...product, isFeaturedOnHome: newFeaturedState };

      if (product._id) {
        const response = await axios.put(
          `${API_URL}/products/${product._id}`,
          { isFeaturedOnHome: newFeaturedState },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response?.data?.product) {
          updatedProduct = response.data.product;
        }
      }

      updateProduct(updatedProduct);
      console.log('[FEATURED] Updated successfully');
    } catch (error) {
      console.error('Unable to update featured state:', error?.response?.data || error.message || error);
      alert('Failed to update featured state: ' + (error?.response?.data?.message || error.message));
    }
  };

  const handleEditClick = (product) => {
    // Only admin can edit products
    if (isCoAdmin) {
      setErrorMessage('Co-admins can only view products. Contact admin for edit access.');
      return;
    }
    
    if (!product._id) {
      setErrorMessage('Cannot edit default products. Only database products can be edited.');
      return;
    }
    setEditingProductId(product._id);
    
    // Initialize stock object with all sizes
    let stockData = {};
    if (product.stock instanceof Map) {
      stockData = Object.fromEntries(product.stock.entries());
    } else if (product.stock && typeof product.stock === 'object' && !Array.isArray(product.stock)) {
      // Stock is already an object like { S: 10, M: 5 }
      stockData = { ...product.stock };
    } else if (typeof product.stock === 'number' && Array.isArray(product.sizes)) {
      // Older products with simple numeric stock should map to every size
      product.sizes.forEach(size => {
        stockData[size] = product.stock;
      });
    } else if (Array.isArray(product.sizes)) {
      // Initialize each size with 0 stock
      product.sizes.forEach(size => {
        stockData[size] = 0;
      });
    }

    const activeCurrency = currencySettings?.currency || 'INR';
    const currentCurrencyPrice = product.prices?.[activeCurrency] ?? product.prices?.get?.(activeCurrency);
    const currentCurrencyOriginal = product.prices?.[`${activeCurrency}_original`] ?? product.prices?.get?.(`${activeCurrency}_original`);
    const displayPrice = currentCurrencyPrice !== undefined && currentCurrencyPrice !== null
      ? currentCurrencyPrice
      : (activeCurrency === 'INR' ? product.price : convertFromINR(product.price, activeCurrency));
    const displayOriginalPrice = currentCurrencyOriginal !== undefined && currentCurrencyOriginal !== null
      ? currentCurrencyOriginal
      : (activeCurrency === 'INR' ? product.originalPrice : product.originalPrice ? convertFromINR(product.originalPrice, activeCurrency) : '');

    setEditValues({
      name: product.name,
      category: DEFAULT_CATEGORIES.includes(product.category) ? product.category : '',
      customCategory: !DEFAULT_CATEGORIES.includes(product.category) ? product.category : '',
      showCustomCategory: !DEFAULT_CATEGORIES.includes(product.category),
      price: displayPrice !== undefined && displayPrice !== null ? formatCurrencyInputValue(String(displayPrice), activeCurrency) : '',
      prices: product.prices || {},
      originalPrice: displayOriginalPrice !== undefined && displayOriginalPrice !== null ? formatCurrencyInputValue(String(displayOriginalPrice), activeCurrency) : '',
      stock: stockData,
      rating: product.rating || 0,
      description: product.description || '',
      materialAndCare: product.materialAndCare || '',
      countryOfOrigin: product.countryOfOrigin || '',
      image: normalizeImageUrl(product.image || ''),
      images: (product.images || []).map(normalizeImageUrl),
      colors: product.colors?.length > 0 ? product.colors : [''],
      sizes: product.sizes ||[],
      allowReturn: product.allowReturn !== false,
      allowReplacement: product.allowReplacement !== false,
      isNew: product.isNew === true || product.isNew === 'true',
      isFeaturedOnHome: product.isFeaturedOnHome === true || product.isFeaturedOnHome === 'true',
      showSimilarProductButton: product.showSameColorButton === true || product.showSameColorButton === 'true',
      similarProducts: product.similarProducts ? product.similarProducts.join(', ') : '',
      isKidsProduct: product.isKidsProduct === true || product.isKidsProduct === 'true',
      kidsType: product.kidsType || '',
      customKidsType: product.kidsType === 'custom' ? product.customKidsType || '' : ''
    });
    setErrorMessage('');
  };

  const handleColorChange = (index, value) => {
    setEditValues(prev => ({
      ...prev,
      colors: prev.colors.map((color, idx) => idx === index ? value : color)
    }));
  };

  // NEW: EyeDropper tool for selecting color from anywhere on screen
  const handleEyeDropper = async (index) => {
    if (!window.EyeDropper) {
      alert("Your browser does not support the EyeDropper API (Try Chrome or Edge)");
      return;
    }
    try {
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      handleColorChange(index, result.sRGBHex); // Automatically updates the color
    } catch (e) {
      console.log('EyeDropper closed or failed', e);
    }
  };

  const handleAddColor = () => {
    setEditValues(prev => ({
      ...prev,
      colors: [...prev.colors, '']
    }));
  };

  const handleRemoveColor = (index) => {
    setEditValues(prev => ({
      ...prev,
      colors: prev.colors.filter((_, idx) => idx !== index)
    }));
  };

  const handleImageUrlChange = (index, value) => {
    setEditValues(prev => ({
      ...prev,
      images: prev.images.map((img, idx) => idx === index ? normalizeImageUrl(value) : img)
    }));
  };

  const handleAddImageUrl = () => {
    setEditValues(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const handleRemoveImageUrl = (index) => {
    setEditValues(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index)
    }));
  };

  // NEW: File upload handler
  const handleFileUpload = async (files, isMainImage = false) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only JPEG, PNG, GIF, WebP allowed.`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Max 5MB allowed.`);
        return false;
      }
      return true;
    });

    for (const file of validFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
          const uploadedUrl = response.data.url;
          if (isMainImage) {
            setEditValues(prev => ({
              ...prev,
              image: uploadedUrl
            }));
            setSuccessMessage(`Image uploaded: ${file.name}`);
          } else {
            setEditValues(prev => ({
              ...prev,
              images: [...prev.images, uploadedUrl]
            }));
            setSuccessMessage(`Image uploaded: ${file.name}`);
          }
          setTimeout(() => setSuccessMessage(''), 2000);
        }
      } catch (error) {
        setErrorMessage(`Failed to upload ${file.name}: ${error.message}`);
        console.error('Upload error:', error);
      }
    }
  };

  // NEW: Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e, isMainImage = false) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    handleFileUpload(files, isMainImage);
  };

  const handlePriceChange = (currency, value, type = 'price') => {
    const fieldKey = type === 'original' ? `${currency}_original` : currency;
    setEditValues(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [fieldKey]: value ? Number(value) : undefined
      }
    }));
  };

  const handleSizeToggle = (size) => {
    setEditValues(prev => {
      const nextSizes = prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size];

      const nextStock = { ...prev.stock };
      if (!nextSizes.includes(size)) {
        delete nextStock[size];
      } else if (nextStock[size] === undefined) {
        nextStock[size] = 0;
      }

      return {
        ...prev,
        sizes: nextSizes,
        stock: nextStock,
      };
    });
  };

  const handleSaveEdit = async () => {
    const finalCategory = editValues.showCustomCategory ? editValues.customCategory : editValues.category;
    if (!finalCategory?.trim()) {
      setErrorMessage('Category is required');
      return;
    }
    if (!editValues.colors.some((color) => color.trim())) {
      setErrorMessage('Select at least one color');
      return;
    }
    if (editValues.sizes.length === 0) {
      setErrorMessage('Select at least one size');
      return;
    }
    if (!editValues.stock || Object.keys(editValues.stock).length === 0) {
      setErrorMessage('Set stock for each selected size');
      return;
    }

    // Validate all selected sizes have stock > 0
    const allSizesHaveStock = editValues.sizes.every(size => {
      const stockValue = Number(editValues.stock[size]) || 0;
      return stockValue >= 0;
    });

    if (!allSizesHaveStock) {
      setErrorMessage('Stock values must be set for all selected sizes');
      return;
    }

    setSavingId(editingProductId);
    
    // Convert stock values to numbers to ensure proper storage
    const cleanStock = {};
    Object.entries(editValues.stock).forEach(([size, value]) => {
      cleanStock[size] = value === '' ? 0 : Number(value) || 0;
    });
    const totalStock = Object.values(cleanStock).reduce((sum, value) => sum + value, 0);

    console.log('[ProductList] Saving product stock payload:', {
      id: editingProductId,
      stock: cleanStock,
      totalStock,
      sizes: editValues.sizes,
      name: editValues.name
    });

    try {
      const token = localStorage.getItem('adminToken');
      const activeCurrency = currencySettings?.currency || 'INR';
      const enteredPrice = Number(editValues.price) || 0;
      const pricesPayload = { ...editValues.prices };
      let basePrice = enteredPrice;

      if (activeCurrency !== 'INR') {
        pricesPayload[activeCurrency] = enteredPrice;
        basePrice = convertToINR(enteredPrice, activeCurrency);
      }

      const enteredOriginalPrice = editValues.originalPrice !== '' ? Number(editValues.originalPrice) : undefined;
      let baseOriginalPrice = enteredOriginalPrice;
      if (activeCurrency !== 'INR' && enteredOriginalPrice !== undefined) {
        pricesPayload[`${activeCurrency}_original`] = enteredOriginalPrice;
        baseOriginalPrice = convertToINR(enteredOriginalPrice, activeCurrency);
      }

      const totalFeaturedCount = products.filter(
        (p) => p.isFeaturedOnHome === true || p.isFeaturedOnHome === 'true'
      ).length;
      const kidsFeaturedCount = products.filter(
        (p) => (p.isFeaturedOnHome === true || p.isFeaturedOnHome === 'true') && p.isKidsProduct
      ).length;
      const generalFeaturedCount = totalFeaturedCount - kidsFeaturedCount;
      const currentlyEditingIsKids = editValues.isKidsProduct;
      if (editValues.isFeaturedOnHome) {
        if (currentlyEditingIsKids) {
          const kidsExcludingThis = kidsFeaturedCount - (editValues.isFeaturedOnHome ? 1 : 0);
          if (kidsExcludingThis >= KIDS_FEATURED_LIMIT) {
            setErrorMessage(`You can only mark up to ${KIDS_FEATURED_LIMIT} kids products as featured. To increase this limit, update the code.`);
            setSavingId(null);
            return;
          }
        } else {
          const generalExcludingThis = generalFeaturedCount - (editValues.isFeaturedOnHome ? 1 : 0);
          if (generalExcludingThis >= GENERAL_FEATURED_LIMIT) {
            setErrorMessage(`You can only mark up to ${GENERAL_FEATURED_LIMIT} general products as featured. To increase this limit, update the code.`);
            setSavingId(null);
            return;
          }
        }
      }

      const finalKidsType = editValues.isKidsProduct && editValues.kidsType === 'custom' ? (editValues.customKidsType || 'custom') : editValues.kidsType;
      
      const payloadToSend = {
        name: editValues.name,
        category: finalCategory,
        price: basePrice,
        prices: pricesPayload,
        originalPrice: baseOriginalPrice,
        stock: cleanStock,
        totalStock,
        rating: Number(editValues.rating) || 0,
        description: editValues.description,
        materialAndCare: editValues.materialAndCare,
        countryOfOrigin: editValues.countryOfOrigin,
        image: normalizeImageUrl(editValues.image),
        images: editValues.images.map(normalizeImageUrl).filter(Boolean),
        colors: editValues.colors.filter(Boolean),
        sizes: editValues.sizes,
        allowReturn: Boolean(editValues.allowReturn),
        allowReplacement: Boolean(editValues.allowReplacement),
        isNew: Boolean(editValues.isNew),
        isFeaturedOnHome: Boolean(editValues.isFeaturedOnHome),
        showSameColorButton: Boolean(editValues.showSimilarProductButton),
        similarProducts: editValues.similarProducts.split(',').map(id => id.trim()).filter(id => id),
        isKidsProduct: Boolean(editValues.isKidsProduct),
        kidsType: editValues.isKidsProduct ? finalKidsType : null
      };
      console.log('[ProductList] Final payload being sent:', payloadToSend);
      console.log('[ProductList] editValues.isNew:', editValues.isNew, 'Final isNew:', payloadToSend.isNew);
      
      const response = await axios.put(`${API_URL}/products/${editingProductId}`, payloadToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const savedProduct = response.data.product || response.data;
      console.log('[ProductList] Response from backend - savedProduct.isNew:', savedProduct.isNew);
      updateProduct({
        ...savedProduct,
        isNew: savedProduct.isNew === true || savedProduct.isNew === 'true',
        isFeaturedOnHome: savedProduct.isFeaturedOnHome === true || savedProduct.isFeaturedOnHome === 'true',
        showSameColorButton: savedProduct.showSameColorButton === true || savedProduct.showSameColorButton === 'true'
      });

      // Save custom category if it's new
      if (!DEFAULT_CATEGORIES.includes(finalCategory)) {
        setDefaultCategories(prev => {
          if (!prev.includes(finalCategory)) {
            const updated = [...prev, finalCategory];
            const customCats = updated.filter(cat => !DEFAULT_CATEGORIES.includes(cat));
            try {
              localStorage.setItem(CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(customCats));
            } catch (e) {
              console.error('Error saving categories:', e);
            }
            return updated;
          }
          return prev;
        });
      }

      setSuccessMessage('Product updated successfully!');
      await fetchProducts();
      setEditingProductId(null);
      setErrorMessage('');
      setTimeout(() => setSuccessMessage(''), 1500);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update product';
      setErrorMessage(errorMsg);
      console.error('Save error:', error);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (productId) => {
    // Only admin can delete products
    if (isCoAdmin) {
      alert('Co-admins cannot delete products. Contact admin for deletion.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const isLocalProduct = !/^[a-f\d]{24}$/i.test(productId);

        if (isLocalProduct) {
          console.log('Deleting local product:', productId);
          deleteProduct(productId);
          fetchProducts();
          alert('Local product deleted successfully');
          return;
        }

        const token = localStorage.getItem('adminToken');
        console.log('Deleting database product ID:', productId);

        if (!token) {
          alert('No admin token found. Please login again.');
          return;
        }

        const response = await axios.delete(`${API_URL}/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Delete response:', response);
        deleteProduct(productId);
        fetchProducts();
      } catch (error) {
        console.error('Delete error:', error);
        alert(`Failed to delete product: ${error.response?.data?.message || error.message}`);
      }
    }
  };

return (
  <div className="product-list-container">
    <div className="product-list-header">
      <div>
        <p className="product-label">Product Management</p>
        <h1>Manage Products</h1>
        <p className="product-subtitle">
          Search, edit, or remove products quickly with a clean admin view.
        </p>
      </div>
    </div>

    <div className="product-filter-toggle">
      {availableCategoryFilters.map((category) => {
        const label = category === 'all'
          ? 'All Products'
          : category === 'kids'
            ? 'Kids Products'
            : category;

        return (
          <button
            key={category}
            type="button"
            className={filterMode === category ? 'active' : ''}
            onClick={() => setFilterMode(category)}
          >
            {label}
          </button>
        );
      })}
    </div>

    <div className="search-section">
      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
    </div>

    {editingProductId && (
      <div className="edit-form-container">
        <div className="edit-form" onClick={(e) => e.stopPropagation()}>
          <div className="edit-modal-header">
            <h2>Edit Product</h2>
            <button
              type="button"
              className="edit-close-btn"
              onClick={() => {
                setEditingProductId(null);
                setErrorMessage('');
                setSuccessMessage('');
              }}
            >
              ✕
            </button>
          </div>

          {successMessage && <div className="success-message">{successMessage}</div>}
          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <div className="edit-form-grid">
            <div className="edit-form-row">
              <label>Name</label>
              <input
                type="text"
                value={editValues.name}
                onChange={(e) =>
                  setEditValues({ ...editValues, name: e.target.value })
                }
              />
            </div>

            <div className="edit-form-row category-group">
              <label>Category</label>
              <div className="category-input-row">
                <select
                  value={editValues.showCustomCategory ? 'Other' : editValues.category}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'Other') {
                      setEditValues((prev) => ({
                        ...prev,
                        showCustomCategory: true,
                        category: '',
                        customCategory: '',
                      }));
                    } else {
                      setEditValues((prev) => ({
                        ...prev,
                        showCustomCategory: false,
                        category: value,
                        customCategory: '',
                      }));
                    }
                  }}
                >
                  <option value="">Select a category</option>
                  {defaultCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Other">Custom Category</option>
                </select>

                <button
                  type="button"
                  className="custom-category-btn"
                  onClick={() =>
                    setEditValues((prev) => ({
                      ...prev,
                      showCustomCategory: true,
                      category: '',
                      customCategory: '',
                    }))
                  }
                >
                  Custom
                </button>
              </div>

              {editValues.showCustomCategory && (
                <input
                  type="text"
                  value={editValues.customCategory}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      customCategory: e.target.value,
                      category: e.target.value,
                    }))
                  }
                  placeholder="Enter custom category"
                />
              )}
            </div>

            <div className="edit-form-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={editValues.isKidsProduct}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      isKidsProduct: e.target.checked,
                      kidsType: e.target.checked ? 'boys' : '',
                      customKidsType: ''
                    }))
                  }
                />
                <span>👶 Mark as Kids Product</span>
              </label>
            </div>

            {editValues.isKidsProduct && (
              <div className="edit-form-row">
                <label>Kids Type *</label>
                <select
                  value={editValues.kidsType}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      kidsType: e.target.value,
                      customKidsType: ''
                    }))
                  }
                  required
                >
                  <option value="">Select Kids Type</option>
                  <option value="boys"> Boys</option>
                  <option value="girls"> Girls</option>
                  <option value="unisex"> Unisex</option>
                  <option value="baby"> Baby</option>
                  <option value="teens"> Teens</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            )}

            {editValues.isKidsProduct && editValues.kidsType === 'custom' && (
              <div className="edit-form-row">
                <label>Custom Kids Type *</label>
                <input
                  type="text"
                  value={editValues.customKidsType}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      customKidsType: e.target.value
                    }))
                  }
                  placeholder="e.g., Infants, Toddlers"
                  required
                />
              </div>
            )}

            <div className="edit-form-row">
              <label>Price ({currencySettings.symbol || '₹'})</label>
              <input
                type="text"
                inputMode="decimal"
                value={editValues.price}
                onChange={(e) =>
                  setEditValues({ ...editValues, price: e.target.value })
                }
              />
            </div>
            
            <div className="edit-form-row">
              <label>Original Price ({currencySettings.symbol || '₹'})</label>
              <input
                type="text"
                inputMode="decimal"
                value={editValues.originalPrice}
                onChange={(e) =>
                  setEditValues({ ...editValues, originalPrice: e.target.value })
                }
              />
            </div>

            <div className="edit-form-row currency-layout-box">
              <label>Multi-Currency Prices (Optional)</label>
              <p className="help-text">
                Set different prices for different currencies. Leave empty to use automatic conversion.
              </p>

              <div className="currency-prices-grid">
                {CURRENCIES.map((currency) => (
                  <div key={currency.code} className="currency-price-input">
                    <label>{currency.symbol} {currency.name} Price</label>
                    <input
                      type="number"
                      value={editValues.prices[currency.code] || ''}
                      onChange={(e) =>
                        handlePriceChange(currency.code, e.target.value)
                      }
                      placeholder={`Price in ${currency.code}`}
                      step="0.001"
                      min="0"
                    />

                    <label>{currency.symbol} {currency.name} Original Price</label>
                    <input
                      type="number"
                      value={editValues.prices[`${currency.code}_original`] || ''}
                      onChange={(e) =>
                        handlePriceChange(currency.code, e.target.value, 'original')
                      }
                      placeholder={`Original price in ${currency.code}`}
                      step="0.001"
                      min="0"
                    />
                  </div>
                ))}
              </div>

              <div className="currency-controls-under">
                <label>Return / Replacement</label>

                <div className="compact-return-row">
                  <div className="toggle-switch-container">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={editValues.allowReturn}
                        onChange={() =>
                          setEditValues((prev) => ({
                            ...prev,
                            allowReturn: !prev.allowReturn,
                          }))
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className="toggle-label">
                      {editValues.allowReturn ? '↩️ Return' : '⛔ No Return'}
                    </span>
                  </div>

                  <div className="toggle-switch-container">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={editValues.allowReplacement}
                        onChange={() =>
                          setEditValues((prev) => ({
                            ...prev,
                            allowReplacement: !prev.allowReplacement,
                          }))
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className="toggle-label">
                      {editValues.allowReplacement ? <><i className="fa-solid fa-check"></i> Repl</> : <><i className="fa-solid fa-ban"></i> No Repl</>}
                    </span>
                  </div>
                </div>
  <div className="edit-form-row compact-toggle-box">
                    <label>NEW Tag</label>
                    <div className="toggle-switch-container">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={editValues.isNew}
                          onChange={() =>
                            setEditValues((prev) => ({
                              ...prev,
                              isNew: !prev.isNew,
                            }))
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className="toggle-label">
                        {editValues.isNew ? 'Show "NEW" Tag' : 'Hide "NEW" Tag'}
                      </span>
                    </div>
                  </div>
                 <div className="edit-form-row compact-toggle-box">
                    <label>Same Color Button</label>
                    <div className="toggle-switch-container">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={editValues.showSimilarProductButton}
                          onChange={() =>
                            setEditValues((prev) => ({
                              ...prev,
                              showSimilarProductButton: !prev.showSimilarProductButton,
                            }))
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className="toggle-label">
                        {editValues.showSimilarProductButton ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>


              </div>
            </div>

            <div className="edit-form-row image-layout-box">
              <label>Base Image URL / Upload</label>

              <div className="image-upload-section">
                <div
                  className="image-drop-zone"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, true)}
                >
                  <input
                    type="file"
                    id="main-image-input"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files, true)}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="main-image-input" className="file-input-label">
                    📤 Drag & drop image here or click to upload
                  </label>
                </div>
              </div>

              <div className="image-preview-row">
                <input
                  type="text"
                  value={editValues.image}
                  onChange={(e) =>
                    setEditValues({
                      ...editValues,
                      image: normalizeImageUrl(e.target.value),
                    })
                  }
                  placeholder="Or paste image URL here"
                />
                {editValues.image && (
                  <img
                    src={editValues.image}
                    alt="Preview"
                    className="input-img-preview"
                  />
                )}
              </div>

              <div className="quick-images-inside">
                <label>Quick View Images (Extra Images URLs / Upload)</label>

                <div className="image-upload-section">
                  <div
                    className="image-drop-zone"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, false)}
                  >
                    <input
                      type="file"
                      id="quick-images-input"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileUpload(e.target.files, false)}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="quick-images-input" className="file-input-label">
                      📤 Drag & drop images here or click to upload multiple
                    </label>
                  </div>
                </div>

                <div className="quick-view-images-edit">
                  {editValues.images.map((imageUrl, index) => (
                    <div key={index} className="quick-view-image-row">
                      <div className="image-preview-row flex-1">
                        <input
                          type="text"
                          value={imageUrl}
                          onChange={(e) =>
                            handleImageUrlChange(index, e.target.value)
                          }
                          placeholder={`Image URL ${index + 1}`}
                        />
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt="Preview"
                            className="input-img-preview"
                          />
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn-small btn-remove"
                        onClick={() => handleRemoveImageUrl(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn-small btn-add"
                    onClick={handleAddImageUrl}
                  >
                    + Add Image URL
                  </button>
                </div>
              </div>

              <div className="image-controls-under-quick">
                <div className="image-toggle-grid">

                  <div className="edit-form-row compact-toggle-box">
                    <label>Featured</label>
                    <div className="toggle-switch-container">
                      <input
                        type="checkbox"
                        checked={normalizeFeatured(editValues.isFeaturedOnHome)}
                        onChange={() =>
                          setEditValues((prev) => ({
                            ...prev,
                            isFeaturedOnHome: !normalizeFeatured(prev.isFeaturedOnHome),
                          }))
                        }
                      />
                      <span className="toggle-label">Show on Home Page</span>
                    </div>
                  </div>

                 
                </div>
              </div>
            </div>

            {editValues.showSimilarProductButton && (
              <div className="edit-form-row full-width">
                <label>Similar Product IDs</label>
                <input
                  type="text"
                  value={editValues.similarProducts}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      similarProducts: e.target.value,
                    }))
                  }
                  placeholder="e.g., 64a1b2c3d4e5f6789"
                />
              </div>
            )}

            <div className="edit-form-row">
              <label>Available Sizes</label>
              <div className="sizes-selector-compact">
                {getSizesForCategory(
                  editValues.showCustomCategory
                    ? editValues.customCategory
                    : editValues.category
                ).map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`size-btn-compact ${
                      editValues.sizes.includes(size) ? 'selected' : ''
                    }`}
                    onClick={() => handleSizeToggle(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="edit-form-row full-width">
              <label>Size Stock</label>
              <div className="stock-per-size-edit">
                {editValues.sizes.map((size) => (
                  <div key={size} className="stock-input-group">
                    <label>{size}</label>
                    <input
                      type="number"
                      value={editValues.stock[size] ?? ''}
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          stock: {
                            ...prev.stock,
                            [size]: e.target.value === '' ? '' : Number(e.target.value),
                          },
                        }))
                      }
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="edit-form-row full-width">
              <label>Available Colors</label>

              <div className="color-rows">
                {editValues.colors.map((color, index) => (
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

                    <button
                      type="button"
                      className="btn-eyedropper"
                      onClick={() => handleEyeDropper(index)}
                    >
                      <i className="fa-solid fa-magnifying-glass"></i>
                    </button>

                    {editValues.colors.length > 1 && (
                      <button
                        type="button"
                        className="btn-small btn-remove-icon"
                        onClick={() => handleRemoveColor(index)}
                      >
                        ✖
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="btn-small btn-add"
                  onClick={handleAddColor}
                >
                  + Add Color
                </button>
              </div>
            </div>

            <div className="edit-form-row full-width">
              <label>Description</label>
              <textarea
                value={editValues.description}
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    description: e.target.value,
                  })
                }
                rows="2"
              />
            </div>

            <div className="edit-form-row full-width">
              <label>Material & Care (Optional)</label>
              <textarea
                value={editValues.materialAndCare}
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    materialAndCare: e.target.value,
                  })
                }
                rows="2"
              />
            </div>

            <div className="edit-form-row">
              <label>Country of Origin (Optional)</label>
              <input
                type="text"
                value={editValues.countryOfOrigin}
                onChange={(e) =>
                  setEditValues({
                    ...editValues,
                    countryOfOrigin: e.target.value,
                  })
                }
                placeholder="e.g. India"
              />
            </div>
          </div>

          <div className="edit-form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                setEditingProductId(null);
                setErrorMessage('');
                setSuccessMessage('');
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="save-btn"
              onClick={handleSaveEdit}
              disabled={savingId === editingProductId}
            >
              {savingId === editingProductId ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    )}
<div className="table-responsive">
    <table className="products-table">
      <thead>
        <tr>
          <th>Sr</th>
          <th>Product ID</th>
          <th>Name</th>
          <th>Category</th>
          <th>Price</th>
          <th>Stock</th>
          <th>Colors</th>
          <th>Sizes</th>
          <th>Return</th>
          <th>Replacement</th>
          {canEditProducts && (
            <>
              <th>NEW</th>
              <th>Featured</th>
            </>
          )}
          {canViewProducts && <th>Preview</th>}
          {canEditProducts && <th>Actions</th>}
        </tr>
      </thead>

      <tbody>
        {filteredProducts.map((product, index) => (
          <tr key={product._id || product.id}>
            <td>{index + 1}</td>
            <td>#{product._id?.slice(-6) || product.id}</td>
            <td>{product.name}</td>
            <td>{product.category}</td>
            <td>
              {formatAdminPrice(
                product.displayPrice || product.price,
                product.currencySymbol,
                product.currency
              )}
            </td>
            <td>
              <span className={getStockTotal(product.stock) > 0 ? 'in-stock' : 'out-of-stock'}>
                {getStockTotal(product.stock)}
              </span>
            </td>
            <td>
              <div className="color-badges">
                {product.colors?.map((color) => (
                  <span
                    key={color}
                    className="color-badge"
                    style={{
                      borderLeft: `10px solid ${color.startsWith('#') ? color : '#ccc'}`,
                    }}
                  >
                    {color}
                  </span>
                ))}
              </div>
            </td>
            <td>{product.sizes?.join(', ')}</td>
            <td>{product.allowReturn ? 'Yes' : 'No'}</td>
            <td>{product.allowReplacement ? 'Yes' : 'No'}</td>
            {canEditProducts && (
              <>
                <td>{product.isNew ? 'Yes' : 'No'}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={normalizeFeatured(product.isFeaturedOnHome)}
                    onChange={() => handleToggleFeatured(product)}
                  />
                </td>
              </>
            )}
            {canViewProducts && (
              <td className="preview-cell">
                <button 
                  className="preview-btn"
                  onClick={() => openDetailedPreview(product)}
                  title="View product details"
                >
                  <i className="fa-solid fa-eye"></i> View
                </button>
              </td>
            )}
            {canEditProducts && (
              <td className="actions-cell">
                <button className="edit-btn" onClick={() => handleEditClick(product)}>
                  <i className="fa-solid fa-pen"></i> Edit
                </button>
                {canDeleteProducts && (
                  <button className="delete-btn" onClick={() => handleDelete(product._id || product.id)}>
                    <i className="fa-solid fa-trash"></i> Delete
                  </button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
      {previewOpen && (
        <div className="image-preview-overlay" onClick={closePreview}>
          <div className="image-preview-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="image-preview-close" onClick={closePreview}>
              ×
            </button>
            <img src={previewImageUrl} alt="Product Preview" />
          </div>
        </div>
      )}

      {detailedPreviewOpen && detailedPreviewProduct && (
        <div className="detailed-preview-overlay" onClick={closeDetailedPreview}>
          <div className="detailed-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="detailed-preview-close" onClick={closeDetailedPreview}>
              ×
            </button>
            

            <div className="detailed-preview-content">
              <div className="preview-image-section">
                <div className="preview-main-image">
                  {detailedPreviewProduct.image ? (
                    <img 
                      src={normalizeImageUrl(detailedPreviewProduct.image)} 
                      alt={detailedPreviewProduct.name}
                      onClick={() => openFullScreenImage(normalizeImageUrl(detailedPreviewProduct.image))}
                    />
                  ) : (
                    <div className="no-image">No image</div>
                  )}
                </div>
                <div className="preview-thumbnails">
                  {detailedPreviewProduct.images?.map((img, idx) => (
                    <img
                      key={idx}
                      src={normalizeImageUrl(img)}
                      alt={`${detailedPreviewProduct.name} ${idx}`}
                      className="thumbnail"
                      onClick={() => openFullScreenImage(normalizeImageUrl(img))}
                    />
                  ))}
                </div>
              </div>

              <div className="preview-details-section">
                <h2>{detailedPreviewProduct.name}</h2>
                
                <div className="preview-detail-row">
                  <span className="label">Product ID:</span>
                  <span className="value">#{detailedPreviewProduct._id?.slice(-6) || detailedPreviewProduct.id}</span>
                </div>

                <div className="preview-detail-row">
                  <span className="label">Category:</span>
                  <span className="value">{detailedPreviewProduct.category}</span>
                </div>

                <div className="preview-detail-row">
                  <span className="label">Price:</span>
                  <span className="value">
                    {formatAdminPrice(
                      detailedPreviewProduct.displayPrice || detailedPreviewProduct.price,
                      detailedPreviewProduct.currencySymbol,
                      detailedPreviewProduct.currency
                    )}
                  </span>
                </div>

                <div className="preview-detail-row">
                  <span className="label">Stock:</span>
                  <span className="value">{getStockTotal(detailedPreviewProduct.stock)}</span>
                </div>

                <div className="preview-detail-row">
                  <span className="label">Colors:</span>
                  <div className="color-badges">
                    {detailedPreviewProduct.colors?.map((color) => (
                      <span
                        key={color}
                        className="color-badge"
                        style={{
                          borderLeft: `10px solid ${color.startsWith('#') ? color : '#ccc'}`,
                        }}
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="preview-detail-row">
                  <span className="label">Sizes:</span>
                  <span className="value">{detailedPreviewProduct.sizes?.join(', ') || 'N/A'}</span>
                </div>

                <div className="preview-detail-row">
                  <span className="label">Return:</span>
                  <span className="value">{detailedPreviewProduct.allowReturn ? <><i className="fa-solid fa-check"></i> Yes</> : <><i className="fa-solid fa-x"></i> No</>}</span>
                </div>

                <div className="preview-detail-row">
                  <span className="label">Replacement:</span>
                  <span className="value">{detailedPreviewProduct.allowReplacement ? <><i className="fa-solid fa-check"></i> Yes</> : <><i className="fa-solid fa-x"></i> No</>}</span>
                </div>

                <div className="preview-detail-row">
                  <span className="label">Featured:</span>
                  <span className="value">{normalizeFeatured(detailedPreviewProduct.isFeaturedOnHome) ? <><i className="fa-solid fa-star"></i> Yes</> : 'No'}</span>
                </div>

                {detailedPreviewProduct.description && (
                  <div className="preview-detail-row full-width">
                    <span className="label">Description:</span>
                    <p className="value description-text">{detailedPreviewProduct.description}</p>
                  </div>
                )}

                {detailedPreviewProduct.materialAndCare && (
                  <div className="preview-detail-row full-width">
                    <span className="label">Material & Care:</span>
                    <p className="value description-text">{detailedPreviewProduct.materialAndCare}</p>
                  </div>
                )}

                {detailedPreviewProduct.countryOfOrigin && (
                  <div className="preview-detail-row">
                    <span className="label">Country of Origin:</span>
                    <span className="value">{detailedPreviewProduct.countryOfOrigin}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {fullScreenImageOpen && (
        <div className="fullscreen-image-overlay" onClick={closeFullScreenImage}>
          <button className="fullscreen-image-close" onClick={closeFullScreenImage}>
            ×
          </button>
          <img src={fullScreenImageUrl} alt="Full size view" />
        </div>
      )}
  </div>

);
};

export default ProductList;