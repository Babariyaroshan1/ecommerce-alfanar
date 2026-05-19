'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useProductStore } from '@/store/productStore';
import { useToastStore } from '@/store/toastStore';
import Link from 'next/link';
import './ProductidDetails.css'; // Nayi CSS file import kar rahe hain

const slugify = (value) =>
  value?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';

const normalizeDriveImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed.includes('drive.google.com')) return trimmed;

  if (trimmed.includes('drive.google.com/uc?export=view') || trimmed.includes('drive.google.com/uc?export=download')) {
    return trimmed;
  }

  const fileIdMatch = trimmed.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{10,})/);
  const fileId = fileIdMatch ? fileIdMatch[1] : null;
  if (!fileId) return trimmed;

  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

const normalizeProductImages = (product) => {
  const images = product?.images;
  console.log('normalizeProductImages input:', images, 'type:', typeof images);
  
  let result = [];
  
  if (Array.isArray(images)) {
    result = images.filter(img => img && typeof img === 'string' && img.trim().length > 0);
    console.log('Array case, filtered:', result);
  } else if (typeof images === 'string') {
    result = images.split(',').map((img) => img.trim()).filter(img => img.length > 0);
    console.log('String case, split:', result);
  } else if (images && typeof images === 'object') {
    result = Object.values(images).filter(img => img && typeof img === 'string' && img.trim().length > 0);
    console.log('Object case, values:', result);
  }
  
  result = result.map(normalizeDriveImageUrl);
  console.log('Final normalized images:', result);
  return result;
};

const formatPrice = (value, currencyCode = 'INR', symbol = '₹') => {
  const numeric = Number(value || 0);
  const useKWD = currencyCode === 'KWD';
  const displaySymbol = useKWD ? 'KWD' : '₹';
  const formattedValue = useKWD ? numeric.toFixed(3) : numeric.toFixed(2);
  return `${displaySymbol} ${formattedValue}`;
};

const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value));

// Check if product is unavailable for current selected currency
const isProductUnavailable = (product, currencySettings, selectedCurrency) => {
  if (!product) return true;

  const currentCurrency = selectedCurrency || currencySettings?.currency || 'KWD';
  if (currentCurrency === 'INR') {
    const inrPrice = product.prices?.INR;
    const hasINRPrice = inrPrice !== undefined && inrPrice !== null;
    if (!hasINRPrice) {
      return true; // Unavailable for India - no INR pricing
    }
  }

  return false;
};

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  
  const products = useProductStore((state) => state.products);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const { currencySettings, selectedCurrency } = useProductStore();
  const { addToCart } = useCartStore();
  const { favorites, toggleFavorite } = useFavoritesStore();
  const { addToast } = useToastStore();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [activeAccordion, setActiveAccordion] = useState('details'); // Accordion state
  const [activeFaq, setActiveFaq] = useState(null);

  // Image overlay state
  const [showImageOverlay, setShowImageOverlay] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const allowReturn = product?.allowReturn !== false;
  const allowReplacement = product?.allowReplacement !== false;

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');

      const fallbackProduct = products.find((item) => String(item.id) === String(id) || String(item._id) === String(id));
      const shouldSkipBackend = !isValidObjectId(id);

      if (shouldSkipBackend) {
        if (fallbackProduct) {
          setProduct(fallbackProduct);
          setLoading(false);
          return;
        }

        if (products.length > 0) {
          setProduct(null);
          setError('Product not found');
          setLoading(false);
          return;
        }

        // If products are still loading, keep waiting until the next effect run.
        setProduct(null);
        return;
      }

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production
        const response = await fetch(`${API_URL}/api/products/${id}`);
        if (!response.ok) throw new Error('Product not found');
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setProduct(fallbackProduct || null);
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id, products]);

  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors?.[0] || '');
      setSelectedSize(product.sizes?.[0] || '');
    }
  }, [product]);

  const isFavorite = product && favorites.some(item => String(item.id || item._id) === String(product.id || product._id));

  const handleAddToCart = (e) => {
    if (!product) return;
    
    // Check if product is unavailable
    if (isProductUnavailable(product, currencySettings, selectedCurrency)) {
      addToast('This product is not available for your country.', 'error', 3000);
      return;
    }
    
    // Check if product is out of stock
    const selectedSizeStock = typeof product.stock === 'object' ? product.stock[selectedSize] || 0 : product.stock;
    if (selectedSizeStock === 0 || maxStock === 0) {
      addToast('This product is currently out of stock.', 'error', 3000);
      return;
    }
    
    // Add click animation to button
    if (e && e.target) {
      e.target.classList.add('clicked');
      setTimeout(() => e.target.classList.remove('clicked'), 600);
    }
    
    addToCart({
      ...product,
      price: currentPrice ?? numericCurrentPrice,
      displayPrice: currentPrice ?? numericCurrentPrice,
      currency: productCurrency,
      currencySymbol: productSymbol,
      selectedColor: selectedColor || product.colors?.[0] || 'Default',
      selectedSize: selectedSize || product.sizes?.[0] || 'One Size',
      quantity: Number(quantity),
    }, selectedSizeStock);
    
    // Enhanced toast notification
    addToast(`${product.name} added to cart successfully!`, 'success', 4000);
  };

  const handleBuyNow = (e) => {
    if (!product) return;
    
    // Check if product is unavailable
    if (isProductUnavailable(product, currencySettings, selectedCurrency)) {
      addToast('This product is not available for your country.', 'error', 3000);
      return;
    }
    
    // Check if product is out of stock
    const selectedSizeStock = typeof product.stock === 'object' ? product.stock[selectedSize] || 0 : product.stock;
    if (selectedSizeStock === 0 || maxStock === 0) {
      addToast('This product is currently out of stock.', 'error', 3000);
      return;
    }
    
    // Add click animation to button
    if (e && e.target) {
      e.target.classList.add('clicked');
      setTimeout(() => e.target.classList.remove('clicked'), 600);
    }
    
    addToCart({
      ...product,
      price: currentPrice ?? numericCurrentPrice,
      displayPrice: currentPrice ?? numericCurrentPrice,
      currency: productCurrency,
      currencySymbol: productSymbol,
      selectedColor: selectedColor || product.colors?.[0] || 'Default',
      selectedSize: selectedSize || product.sizes?.[0] || 'One Size',
      quantity: Number(quantity),
    }, selectedSizeStock);
    
    addToast(`${product.name} added to cart. Redirecting to checkout...`, 'success', 2000);
    setTimeout(() => {
      router.push('/checkout');
    }, 500);
  };

  const handleReturnRequest = () => {
    addToast('Please contact customer support to initiate a return request.', 'info', 5000);
    // You can redirect to a contact page or open a modal here
    // router.push('/contact?reason=return&product=' + product._id);
  };

  const handleReplacementRequest = () => {
    addToast('Please contact customer support to initiate a replacement request.', 'info', 5000);
    // You can redirect to a contact page or open a modal here
    // router.push('/contact?reason=replacement&product=' + product._id);
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    
    // Prevent adding to wishlist if product is unavailable
    if (isProductUnavailable(product, currencySettings, selectedCurrency)) {
      addToast('Cannot add unavailable products to wishlist.', 'error', 3000);
      return;
    }
    
    toggleFavorite(product);
    const isNowFavorite = !isFavorite;
    addToast(
      isNowFavorite 
        ? `❤️ ${product.name} added to wishlist!` 
        : `💔 ${product.name} removed from wishlist.`,
      'success',
      3000
    );
  };

  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [similarProductsList, setSimilarProductsList] = useState([]);

  const handleOpenSameColorProduct = () => {
    let similarProducts = [];

    // First, check if product has specific similar products defined
    if (product.similarProducts && product.similarProducts.length > 0) {
      similarProducts = products.filter(p => product.similarProducts.includes(p._id));
    } else {
      // Fallback to same color logic
      const currentColor = (selectedColor || product.colors?.[0] || '').toString().toLowerCase();
      if (!currentColor) {
        addToast('Select a color first to see matching products.', 'info', 3000);
        return;
      }

      similarProducts = products.filter((item) => {
        const itemId = String(item._id || item.id);
        const currentId = String(product._id || product.id);
        return itemId !== currentId && Array.isArray(item.colors) && item.colors.some((c) => c.toString().toLowerCase() === currentColor);
      });
    }

    if (similarProducts.length === 0) {
      addToast('No similar products found.', 'info', 3000);
      return;
    }

    if (similarProducts.length === 1) {
      const nextProductId = similarProducts[0]._id || similarProducts[0].id;
      router.push(`/product/${nextProductId}`);
    } else {
      setSimilarProductsList(similarProducts);
      setShowSimilarModal(true);
    }
  };

  // Image overlay handlers
  const openImageOverlay = (index) => {
    setCurrentImageIndex(index);
    setShowImageOverlay(true);
    setIsImageZoomed(false);
  };

  const closeImageOverlay = () => {
    setShowImageOverlay(false);
    setIsImageZoomed(false);
  };

  useEffect(() => {
    if (!showImageOverlay) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow || '';
    };
  }, [showImageOverlay]);

  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? uniqueImages.length - 1 : prev - 1));
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev === uniqueImages.length - 1 ? 0 : prev + 1));
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  // Keyboard navigation for overlay
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showImageOverlay) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          goToPreviousImage();
          break;
        case 'ArrowRight':
          goToNextImage();
          break;
        case 'Escape':
          closeImageOverlay();
          break;
      }
    };

    if (showImageOverlay) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showImageOverlay]);

  const toggleAccordion = (section) => {
    setActiveAccordion(activeAccordion === section ? '' : section);
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  if (loading) {
    return <div className="container py-5 text-center">Loading product...</div>;
  }

  if (!product) {
    return <div className="container py-5 text-center">Product not found. <Link href="/products">Go Back</Link></div>;
  }

  const numericCurrentPrice = typeof product.displayPrice === 'number'
    ? product.displayPrice
    : typeof product.price === 'number'
      ? product.price
      : Number(String(product.price || 0).replace(/[^0-9.]/g, '')) || 0;
  const numericOriginalPrice = typeof product.displayOriginalPrice === 'number'
    ? product.displayOriginalPrice
    : typeof product.originalPrice === 'number'
      ? product.originalPrice
      : Number(String(product.originalPrice || 0).replace(/[^0-9.]/g, '')) || 0;

  const effectiveCurrency = currencySettings?.showKwdNavbarOption ? selectedCurrency : 'KWD';
  const effectiveSymbol = effectiveCurrency === 'INR' ? '₹' : 'KWD';

  const getPriceForSelectedCurrency = () => {
    if (effectiveCurrency === 'INR') {
      const inrPrice = product.prices?.INR;
      return inrPrice !== undefined && inrPrice !== null ? inrPrice : null;
    }
    const kwdPrice = product.prices?.KWD;
    return kwdPrice !== undefined && kwdPrice !== null ? kwdPrice : numericCurrentPrice;
  };

  const getOriginalPriceForSelectedCurrency = () => {
    if (effectiveCurrency === 'INR') {
      const inrOriginal = product.prices?.INR_original;
      return inrOriginal !== undefined && inrOriginal !== null ? inrOriginal : null;
    }
    const kwdOriginalPrice = product.prices?.KWD_original;
    return kwdOriginalPrice !== undefined ? kwdOriginalPrice : numericOriginalPrice;
  };

  const currentPrice = getPriceForSelectedCurrency();
  const currentOriginalPrice = getOriginalPriceForSelectedCurrency();
  const isUnavailable = effectiveCurrency === 'INR' && currentPrice === null;
  const productCurrency = effectiveCurrency;
  const productSymbol = effectiveSymbol;
  const formattedPrice = isUnavailable
    ? 'Unavailable'
    : formatPrice(currentPrice ?? numericCurrentPrice, productCurrency, productSymbol);
  const formattedOriginalPrice = currentOriginalPrice > 0
    ? formatPrice(currentOriginalPrice, productCurrency, productSymbol)
    : null;
  const showOriginalPrice = formattedOriginalPrice && currentOriginalPrice > (currentPrice ?? numericCurrentPrice);

  const categorySlug = slugify(product.categorySlug || product.category || 'category');
  
  // Combine all images - show all images, don't remove duplicates as they might be different views
  const normalizedImages = normalizeProductImages(product);
  console.log('Product images debug:', {
    productImage: product.image,
    productImages: product.images,
    productImagesType: typeof product.images,
    productImagesIsArray: Array.isArray(product.images),
    normalizedImages,
    normalizedImagesLength: normalizedImages.length
  });
  
  // Combine main image with additional images
  const allImages = [];
  if (product.image && product.image.trim()) {
    allImages.push(normalizeDriveImageUrl(product.image.trim()));
  }
  // Add all additional images, even if they're similar to main image
  allImages.push(...normalizedImages);
  
  console.log('Final images before filtering:', allImages, 'length:', allImages.length);
  
  // Only remove exact duplicates
  const uniqueImages = allImages.filter((image, index) => allImages.indexOf(image) === index);
  console.log('Final unique images:', uniqueImages, 'length:', uniqueImages.length);

  const previewCount = 3;
  const showMorePlaceholder = uniqueImages.length > previewCount;
  const previewImages = uniqueImages.slice(0, previewCount);
  const placeholderImage = showMorePlaceholder ? uniqueImages[previewCount] : null;
  const extraImageCount = showMorePlaceholder ? uniqueImages.length - previewCount : 0;

  // Calculate max stock for dropdown
  const maxStock = typeof product.stock === 'object' ? (product.stock[selectedSize] || 0) : (product.stock || 10);
  const quantityOptions = Array.from({ length: Math.min(maxStock, 10) }, (_, i) => i + 1);

  // Get random related products (exclude current product)
  const getRandomRelatedProducts = () => {
    let relatedProducts = products.filter(p => String(p._id || p.id) !== String(product._id || product.id));
    
    // Shuffle array
    for (let i = relatedProducts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [relatedProducts[i], relatedProducts[j]] = [relatedProducts[j], relatedProducts[i]];
    }
    
    // Return first 4 products
    return relatedProducts.slice(0, 4);
  };

  const relatedProducts = getRandomRelatedProducts();

  return (
    <div className="tss-layout-container">
      
      {/* BREADCRUMBS */}
      <div className="tss-breadcrumbs">
        <Link href="/">Home</Link> / 
        <Link href="/products">Products</Link> / 
        <Link href={`/category/${categorySlug}`}>{product.category}</Link> / 
        <span>{product.name}</span>
      </div>

      <div className="tss-main-row">
        
        {/* LEFT: IMAGE GRID */}
        <div className="tss-left-images">
          <div className="tss-image-grid">
            {uniqueImages.length === 0 ? (
              <div className="tss-img-wrapper">
                <img src="https://via.placeholder.com/500x500?text=No+Images" alt="No images available" />
              </div>
            ) : (
              <>
                {previewImages.map((src, index) => (
                  <div
                    key={index}
                    className="tss-img-wrapper"
                    onClick={() => openImageOverlay(index)}
                  >
                    <img
                      src={src}
                      alt={`${product.name} - ${index + 1}`}
                      onError={(e) => {
                        console.error('Image failed to load:', src);
                        const target = e.currentTarget as HTMLImageElement;
                        if (target && target.src && target.src.includes('drive.google.com/uc?export=view&id=')) {
                          target.src = target.src.replace('export=view', 'export=download');
                          return;
                        }
                        target.src = 'https://via.placeholder.com/500x500?text=Image+Error';
                      }}
                    />
                  </div>
                ))}

                {showMorePlaceholder && placeholderImage && (
                  <div
                    className="tss-more-images-box"
                    onClick={() => openImageOverlay(previewImages.length)}
                  >
                    <img
                      className="tss-more-images-bg"
                      src={placeholderImage}
                      alt="More images preview"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target && target.src && target.src.includes('drive.google.com/uc?export=view&id=')) {
                          target.src = target.src.replace('export=view', 'export=download');
                          return;
                        }
                        target.src = 'https://via.placeholder.com/500x500?text=Image+Error';
                      }}
                    />
                    <div className="tss-more-images-count">
                      <span>+{extraImageCount}</span>
                      <small>More Images</small>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Total images: {uniqueImages.length}
          </div>
        </div>

        {/* RIGHT: STICKY PRODUCT INFO */}
        <div className="tss-right-info">
          <div className="tss-sticky-box">
            
            <h1 className="tss-title">{product.name}</h1>
            <p className="tss-subtitle">{product.category || 'Premium Collection'}</p>

            <div className="tss-price-section">
              <div className="tss-price-row">
                <span className="tss-price">{formattedPrice}</span>
                {showOriginalPrice && (
                  <span className="tss-original-price-desk">{formattedOriginalPrice}</span>
                )}
              </div>
              {/* <p className="tss-tax-info">Price incl. of all taxes</p> */}
            </div>

            {/* COLORS (Optional based on your data) */}
            {product.colors && product.colors.length > 0 && (
              <div className="tss-section">
                <p className="tss-label">Color:</p>
                <div className="tss-colors">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      className={`tss-color-btn ${selectedColor === color ? 'active' : ''}`}
                      onClick={() => setSelectedColor(color)}
                      title={color}
                    >
                      {color}
                    </button>
                  ))}

                  {(product.showSameColorButton || product.showSimilarProductButton) && (
                    <button
                      type="button"
                      className="tss-btn tss-btn-similar tss-color-row-btn"
                      onClick={handleOpenSameColorProduct}
                    >
                      View Similar Patterns
                    </button>
                  )}
                </div>
              </div>
            )}

           
            {/* SIZES */}
            <div className="tss-section">
              <div className="tss-size-header">
                <p className="tss-label m-0">Please select a size.</p>
                <span className="tss-size-chart">SIZE CHART</span>
              </div>
              <div className="tss-sizes">
                {(product.sizes || []).map((size) => {
                  const sizeStock = typeof product.stock === 'object' ? product.stock[size] : product.stock;
                  const inStock = sizeStock !== undefined ? sizeStock > 0 : product.stock > 0;
                  const lowStock = inStock && sizeStock <= 3; // Show "X Left" if stock is 3 or less

                  return (
                    <div key={size} className="tss-size-wrapper">
                      <button
                        type="button"
                        className={`tss-size-btn ${selectedSize === size ? 'active' : ''} ${!inStock ? 'disabled' : ''}`}
                        onClick={() => setSelectedSize(size)}
                        disabled={!inStock}
                      >
                        {size}
                      </button>
                      {lowStock && <span className="tss-low-stock">{sizeStock} Left</span>}
                    </div>
                  );
                })}
              </div>
              {(!product.sizes || product.sizes.length === 0) && (
                <p className="text-muted small">One Size Fits All</p>
              )}
            </div>

            {/* QUANTITY DROPDOWN */}
            <div className="tss-section tss-qty-section">
              <label>Quantity</label>
              <select 
                value={quantity} 
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="tss-qty-dropdown"
                disabled={maxStock === 0}
              >
                {maxStock === 0 ? <option value="0">0</option> : quantityOptions.map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {/* ACTION BUTTONS */}
            <div className="tss-action-buttons">
              <button 
                className="tss-btn tss-btn-cart" 
                onClick={handleAddToCart}
                disabled={maxStock === 0 || isUnavailable}
              >
                {isUnavailable ? 'UNAVAILABLE' : 'ADD TO CART'}
              </button>
              <button 
                className="tss-btn tss-btn-buy-now" 
                onClick={handleBuyNow}
                disabled={maxStock === 0 || isUnavailable}
              >
                {isUnavailable ? 'UNAVAILABLE' : 'BUY NOW'}
              </button>
            </div>

            <div className="tss-action-buttons">
              <button 
                className="tss-btn tss-btn-wishlist" 
                onClick={handleToggleWishlist}
                disabled={isUnavailable}
              >
                {isFavorite ? '♥ ADDED' : '♡ ADD TO WISHLIST'}
              </button>
            </div>

            {/* SHARE ICONS */}
            <div className="tss-share">
              <span>Share:</span>
              <div className="tss-social-icons">
                <i className="fa-brands fa-whatsapp"></i>
                <i className="fa-brands fa-facebook"></i>
                <i className="fa-brands fa-twitter"></i>
                <i className="fa-brands fa-instagram"></i>
              </div>
            </div>

            {/* DELIVERY CHECKER */}
            <div className="tss-delivery">
              <p className="tss-label">Delivery Details</p>
              <p className="tss-delivery-note">
                <i className="fa-solid fa-rotate"></i>
                {allowReturn && allowReplacement
                  ? ' This product is eligible for return and replacement under our 5-7day policy. No questions asked.'
                  : allowReturn
                    ? ' Return is available for this product under our 30-day policy. Replacement is not available.'
                    : allowReplacement
                      ? ' Replacement is available for this product under our 30-day policy. Return is not available.'
                      : ' Return and replacement are not available for this product at this time.'}
              </p>
              
              {/* RETURN/REPLACEMENT BUTTONS */}
              
            </div>

            {/* ACCORDIONS */}
            <div className="tss-accordions">
              
              <div className="tss-acc-item">
                <button className="tss-acc-header" onClick={() => toggleAccordion('details')}>
                  Product Details <span>{activeAccordion === 'details' ? '−' : '+'}</span>
                </button>
                {activeAccordion === 'details' && (
                  <div className="tss-acc-body">
                    {product.materialAndCare && (
                      <p><strong>Material & Care:</strong><br/>{product.materialAndCare}</p>
                    )}
                    {product.countryOfOrigin && (
                      <p><strong>Country of Origin:</strong> {product.countryOfOrigin}</p>
                    )}
                    <p><strong>Description:</strong><br/>{product.description || 'Premium quality fabric crafted carefully for comfort and style.'}</p>
                  </div>
                )}
              </div>

              <div className="tss-acc-item">
                <button className="tss-acc-header" onClick={() => toggleAccordion('desc')}>
                  Product Description <span>{activeAccordion === 'desc' ? '−' : '+'}</span>
                </button>
                {activeAccordion === 'desc' && (
                  <div className="tss-acc-body">
                    <p>{product.details || 'Step out in style with this exclusive piece. Designed to provide a relaxed and comfortable fit while maintaining a sharp look.'}</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* IMAGE OVERLAY MODAL */}
      {showImageOverlay && (
        <div className="tss-image-overlay">
          <div className="tss-overlay-content" onClick={(e) => e.stopPropagation()}>
            <button className="tss-overlay-close" onClick={closeImageOverlay}>
              ×
            </button>

            {uniqueImages.length > 1 && (
              <>
                <button className="tss-overlay-navigation tss-overlay-prev" onClick={goToPreviousImage}>
                  ‹
                </button>
                <button className="tss-overlay-navigation tss-overlay-next" onClick={goToNextImage}>
                  ›
                </button>
              </>
            )}

            <img
              src={uniqueImages[currentImageIndex]}
              alt={`${product.name} - ${currentImageIndex + 1}`}
              className={`tss-overlay-image ${isImageZoomed ? 'zoomed' : ''}`}
              onClick={() => setIsImageZoomed((prev) => !prev)}
              title={isImageZoomed ? 'Click to zoom out' : 'Click to zoom in'}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (target && target.src && target.src.includes('drive.google.com/uc?export=view&id=')) {
                  target.src = target.src.replace('export=view', 'export=download');
                  return;
                }
                target.src = 'https://via.placeholder.com/800x800?text=Image+Error';
              }}
            />

            {uniqueImages.length > 1 && (
              <div className="tss-overlay-dots">
                {uniqueImages.map((_, index) => (
                  <button
                    key={index}
                    className={`tss-overlay-dot ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => goToImage(index)}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RELATED PRODUCTS SECTION */}
      {relatedProducts.length > 0 && (
        <div className="tss-related-products">
          <h2 className="tss-related-title">You Might Also Like</h2>
          <div className="tss-related-grid">
            {relatedProducts.map((relatedProduct) => {
              const relatedCurrency = effectiveCurrency;
              const relatedSymbol = relatedCurrency === 'KWD' ? 'KWD' : '₹';

              const relatedPriceValue = relatedCurrency === 'INR'
                ? relatedProduct.prices?.INR
                : relatedProduct.prices?.KWD;

              const relatedOrigPriceValue = relatedCurrency === 'INR'
                ? relatedProduct.prices?.INR_original
                : relatedProduct.prices?.KWD_original;

              const relatedUnavailable = relatedPriceValue === undefined || relatedPriceValue === null;
              const normalizedRelatedNumPrice = relatedUnavailable
                ? null
                : (typeof relatedPriceValue === 'number'
                  ? relatedPriceValue
                  : Number(String(relatedPriceValue || 0).replace(/[^0-9.]/g, '')) || 0);

              const normalizedRelatedOrigPrice = relatedUnavailable
                ? null
                : (typeof relatedOrigPriceValue === 'number'
                  ? relatedOrigPriceValue
                  : Number(String(relatedOrigPriceValue || 0).replace(/[^0-9.]/g, '')) || 0);

              const relatedFormattedPrice = relatedUnavailable
                ? 'Unavailable'
                : formatPrice(normalizedRelatedNumPrice, relatedCurrency, relatedSymbol);
              const relatedFormattedOriginalPrice = !relatedUnavailable && normalizedRelatedOrigPrice > normalizedRelatedNumPrice
                ? formatPrice(normalizedRelatedOrigPrice, relatedCurrency, relatedSymbol)
                : null;

              return (
                <Link
                  key={relatedProduct._id || relatedProduct.id}
                  href={`/product/${relatedProduct._id || relatedProduct.id}`}
                  className="tss-related-card"
                >
                  <img
                    src={normalizeDriveImageUrl(relatedProduct.image) || 'https://via.placeholder.com/250x250?text=Product'}
                    alt={relatedProduct.name}
                    className="tss-related-image"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (target && target.src && target.src.includes('drive.google.com/uc?export=view&id=')) {
                        target.src = target.src.replace('export=view', 'export=download');
                        return;
                      }
                      target.src = 'https://via.placeholder.com/250x250?text=Product';
                    }}
                  />
                  <div className="tss-related-info">
                    <p className="tss-related-name">{relatedProduct.name}</p>
                    <div>
                      <span className="tss-related-price">{relatedFormattedPrice}</span>
                      {relatedFormattedOriginalPrice && normalizedRelatedOrigPrice > normalizedRelatedNumPrice && (
                        <div className="tss-related-original-price">{relatedFormattedOriginalPrice}</div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="tss-view-all-wrapper">
            <Link href="/products" className="tss-view-all-button">
              View All
            </Link>
          </div>
        </div>
      )}

      {/* FAQ SECTION */}
      <div className="tss-faq-section">
        <h2 className="tss-faq-title">Frequently Asked Questions</h2>
        <p className="tss-faq-subtitle">Find answers to common questions about our products and services</p>
        
        <div className="tss-faq-container">
          <div className={`tss-faq-item ${activeFaq === 0 ? 'active' : ''}`}>
            <div className="tss-faq-question" onClick={() => toggleFaq(0)}>
              <span>What is your return policy?</span>
              <span className="tss-faq-toggle">+</span>
            </div>
            <div className="tss-faq-answer">
              <p>We offer a 30-day return policy for all our products. Items must be in their original condition with tags attached. Return shipping costs are the responsibility of the customer unless the item is defective.</p>
            </div>
          </div>

          <div className={`tss-faq-item ${activeFaq === 1 ? 'active' : ''}`}>
            <div className="tss-faq-question" onClick={() => toggleFaq(1)}>
              <span>How long does shipping take?</span>
              <span className="tss-faq-toggle">+</span>
            </div>
            <div className="tss-faq-answer">
              <p>Standard shipping typically takes 3-7 business days within Kuwait. Express shipping is available for 1-2 business days. International shipping may take 7-14 business days depending on the destination.</p>
            </div>
          </div>

          <div className={`tss-faq-item ${activeFaq === 2 ? 'active' : ''}`}>
            <div className="tss-faq-question" onClick={() => toggleFaq(2)}>
              <span>Do you offer international shipping?</span>
              <span className="tss-faq-toggle">+</span>
            </div>
            <div className="tss-faq-answer">
              <p>Yes, we ship internationally to most countries. Shipping costs and delivery times vary by location. You can see exact rates during checkout based on your shipping address.</p>
            </div>
          </div>

          <div className={`tss-faq-item ${activeFaq === 3 ? 'active' : ''}`}>
            <div className="tss-faq-question" onClick={() => toggleFaq(3)}>
              <span>How do I track my order?</span>
              <span className="tss-faq-toggle">+</span>
            </div>
            <div className="tss-faq-answer">
              <p>Once your order ships, you'll receive a tracking number via email. You can also track your order by logging into your account and viewing your order history.</p>
            </div>
          </div>

          <div className={`tss-faq-item ${activeFaq === 4 ? 'active' : ''}`}>
            <div className="tss-faq-question" onClick={() => toggleFaq(4)}>
              <span>What payment methods do you accept?</span>
              <span className="tss-faq-toggle">+</span>
            </div>
            <div className="tss-faq-answer">
              <p>We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and cash on delivery (COD) for local orders. All payments are processed securely.</p>
            </div>
          </div>

          <div className={`tss-faq-item ${activeFaq === 5 ? 'active' : ''}`}>
            <div className="tss-faq-question" onClick={() => toggleFaq(5)}>
              <span>Are your products authentic?</span>
              <span className="tss-faq-toggle">+</span>
            </div>
            <div className="tss-faq-answer">
              <p>Yes, all our products are 100% authentic and sourced directly from authorized manufacturers. We guarantee the quality and authenticity of every item we sell.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products Modal */}
      {showSimilarModal && (
        <div className="similar-products-modal" onClick={() => setShowSimilarModal(false)}>
          <div className="similar-products-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={() => setShowSimilarModal(false)}>✖</span>
            <h3>Similar Products</h3>
            <div className="similar-products-list">
              {similarProductsList.map((p) => (
                <div
                  key={p._id}
                  className="similar-product-item"
                  onClick={() => {
                    setShowSimilarModal(false);
                    router.push(`/product/${p._id}`);
                  }}
                >
                  <img
                    src={normalizeDriveImageUrl(p.image)}
                    alt={p.name}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/60x60?text=Image';
                    }}
                  />
                  <div>
                    <h4>{p.name}</h4>
                    <p>{formatPrice(p.price, currencySettings.code, currencySettings.symbol)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};