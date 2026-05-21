'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useToastStore } from '@/store/toastStore';
import { useProductStore } from '@/store/productStore';
import './ProductCard.css';

const getProductKey = (item) => {
  return String(item?._id ?? item?.id ?? '');
};

const slugify = (value) =>
  value?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';

const normalizeDriveImageUrl = (url) => {
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
  if (!fileId) return trimmed;

  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

const getDriveFallbackUrl = (src) => {
  if (!src || typeof src !== 'string') return src;
  if (src.includes('drive.google.com/uc?export=view&id=')) {
    return src.replace('export=view', 'export=download');
  }
  if (src.includes('drive.google.com/uc?export=download&id=')) {
    return src.replace('export=download', 'export=view');
  }
  return src;
};

const normalizeProductImages = (product) => {
  const images = product?.images;

  let result = [];
  if (Array.isArray(images)) {
    result = images.filter(Boolean);
  } else if (typeof images === 'string') {
    result = images
      .split(',')
      .map((img) => img.trim())
      .filter(Boolean);
  } else if (images && typeof images === 'object') {
    result = Object.values(images).filter(Boolean);
  }

  return result.map(normalizeDriveImageUrl);
};

const getColorHex = (colorName) => {
  if (!colorName) {
    return '#CCCCCC';
  }

  const trimmed = String(colorName).trim();
  const hexMatch = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
  if (hexMatch.test(trimmed)) {
    return trimmed;
  }

  const colorMap = {
    red: '#FF0000', blue: '#0000FF', green: '#00AA00', black: '#000000',
    white: '#FFFFFF', gray: '#808080', grey: '#808080', yellow: '#FFFF00',
    pink: '#FFC0CB', purple: '#800080', orange: '#FFA500', brown: '#A52A2A',
    navy: '#000080', maroon: '#800000', teal: '#008080', olive: '#808000',
    cream: '#FFFDD0', beige: '#F5F5DC', 'navy blue': '#000080',
    'sky blue': '#87CEEB', 'light blue': '#ADD8E6', 'dark blue': '#00008B',
    'light green': '#90EE90', 'dark green': '#006400', 'light pink': '#FFB6C1',
    'hot pink': '#FF69B4', 'light gray': '#D3D3D3', 'dark gray': '#A9A9A9',
  };
  
  const normalized = trimmed.toLowerCase();
  return colorMap[normalized] || '#CCCCCC';
};

export default function ProductCard({ product: initialProduct, directToProduct = false }) {
  const { addToCart } = useCartStore();
  const { favorites, toggleFavorite } = useFavoritesStore();
  const { addToast } = useToastStore();
  const { currencySettings, products, selectedCurrency } = useProductStore();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [quickViewImages, setQuickViewImages] = useState([]);
  const [selectedQuickImage, setSelectedQuickImage] = useState('');
  const [product, setProduct] = useState(initialProduct);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [cardImageSrc, setCardImageSrc] = useState('');
  const [cardPrevImageSrc, setCardPrevImageSrc] = useState(null);
  const [cardMainImage, setCardMainImage] = useState('');
  const [cardHoverImage, setCardHoverImage] = useState('');
  const [isCardFading, setIsCardFading] = useState(false);

  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  useEffect(() => {
    const mainImage = normalizeDriveImageUrl(product.image) || 'https://via.placeholder.com/500x500';
    const additionalImages = normalizeProductImages(product);
    const allImages = [mainImage, ...additionalImages].filter(Boolean);
    setCardMainImage(mainImage);
    setCardImageSrc(mainImage);
    setCardHoverImage(allImages.length > 1 ? allImages[allImages.length - 1] : mainImage);
  }, [product]);

  useEffect(() => {
    if (showModal) {
      setSelectedColor(product.colors?.[0] || '');
      setSelectedSize(product.sizes?.length === 1 ? product.sizes[0] : '');
      setQuantity(1);
      setDescriptionExpanded(false); // Reset description expansion

      // Main image aur admin URLs ko mila kar duplicate hatayein
      const additionalImages = normalizeProductImages(product);
      const mainImage = normalizeDriveImageUrl(product.image);
      const allImages = [mainImage, ...additionalImages].filter(Boolean);
      const uniqueImages = [...new Set(allImages)];

      setQuickViewImages(uniqueImages);
      setSelectedQuickImage(uniqueImages[0] || 'https://via.placeholder.com/500x500');

      // Disable body scrolling when modal opens
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable body scrolling when modal closes
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, product]);

 

  const productKey = getProductKey(product);
  const isFavorite = favorites.some((item) => getProductKey(item) === productKey);
  const requiresSizeSelection = Array.isArray(product.sizes) && product.sizes.length > 0;
  const selectedSizeStock = requiresSizeSelection
    ? (typeof product.stock === 'object' ? product.stock[selectedSize] || 0 : product.stock || 0)
    : (typeof product.stock === 'object' ? Object.values(product.stock).reduce((sum, v) => sum + Number(v || 0), 0) : product.stock || 0);

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

  const formatProductPrice = (value, currencyCode, symbol) => {
    const numeric = Number(value || 0);
    const displaySymbol = symbol || (currencyCode === 'INR' ? '₹' : 'KWD');
    const formattedValue = currencyCode === 'KWD' ? numeric.toFixed(3) : numeric.toFixed(2);
    return `${displaySymbol} ${formattedValue}`;
  };

  const effectiveCurrency = currencySettings?.showKwdNavbarOption ? selectedCurrency : 'KWD';
  const effectiveSymbol = effectiveCurrency === 'INR' ? '₹' : 'KWD';

  // Get price based on selected currency
  const getPriceForSelectedCurrency = () => {
    if (effectiveCurrency === 'INR') {
      const inrPrice = product.prices?.INR;
      return inrPrice !== undefined && inrPrice !== null ? inrPrice : null;
    }
    const kwdPrice = product.prices?.KWD;
    return kwdPrice !== undefined && kwdPrice !== null ? kwdPrice : numericCurrentPrice;
  };

  const currentPrice = getPriceForSelectedCurrency();
  const isUnavailable = effectiveCurrency === 'INR' && currentPrice === null;

  const formattedPrice = isUnavailable 
    ? 'Unavailable'
    : formatProductPrice(currentPrice || numericCurrentPrice, effectiveCurrency, effectiveSymbol);
  
  const getOriginalPriceForSelectedCurrency = () => {
    if (effectiveCurrency === 'INR') {
      const inrOriginalPrice = product.prices?.[`INR_original`];
      return inrOriginalPrice !== undefined && inrOriginalPrice !== null ? inrOriginalPrice : null;
    }
    const kwdOriginalPrice = product.prices?.[`KWD_original`];
    return kwdOriginalPrice !== undefined ? kwdOriginalPrice : numericOriginalPrice;
  };

  const originalPrice = getOriginalPriceForSelectedCurrency();
  const formattedOriginalPrice = !isUnavailable && originalPrice && originalPrice > 0
    ? formatProductPrice(originalPrice, effectiveCurrency, effectiveSymbol)
    : null;
  const showOriginalPrice = formattedOriginalPrice && (originalPrice > (currentPrice || 0));

  const categorySlug = product.categorySlug || slugify(product.category || product.name);

  const goToCategory = () => {
    router.push(`/category/${categorySlug}`);
  };

  const handleQuickView = (e) => {
    e.stopPropagation();
    if (directToProduct) {
      handleViewDetails(e);
      return;
    }
    setShowModal(true);
  };

  const handleToggleFavorite = (event) => {
    event.stopPropagation();
    
    // Add click animation to button
    if (event && event.target) {
      event.target.classList.add('clicked');
      setTimeout(() => event.target.classList.remove('clicked'), 600);
    }
    
    const wasFavorite = isFavorite;
    toggleFavorite(product);
    
    // Enhanced toast notification
    if (!wasFavorite) {
      addToast(`${product.name} added to wishlist!`, 'success', 3000);
    } else {
      addToast(`${product.name} removed from wishlist`, 'error', 3000);
    }
  };

  const handleShare = (event) => {
    event.stopPropagation();
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/category/${categorySlug}`
      : '';

    if (navigator.share) {
      navigator.share({ title: product.name, url: shareUrl }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      alert('Category link copied to clipboard');
    }
  };

  const handleShowSimilarProducts = (event) => {
    event.stopPropagation();
    if (!product) return;

    let similarProducts = [];

    if (product.similarProducts && product.similarProducts.length > 0) {
      similarProducts = (products || []).filter((item) =>
        product.similarProducts.includes(item._id || item.id)
      );
    } else {
      const currentColor = (selectedColor || product.colors?.[0] || '').toString().toLowerCase();
      if (!currentColor) {
        addToast('No similar products available for this item.', 'info', 3000);
        return;
      }

      similarProducts = (products || []).filter((item) => {
        const itemColorList = item.colors || [];
        const hasMatchingColor = itemColorList.some((color) =>
          String(color).toLowerCase() === currentColor
        );
        return hasMatchingColor && String(item._id || item.id) !== String(product._id || product.id);
      });
    }

    if (!similarProducts.length) {
      addToast('No similar products found.', 'info', 3000);
      return;
    }

    const nextProduct = similarProducts[0];
    const nextProductId = nextProduct?._id || nextProduct?.id;
    if (nextProductId) {
      setShowModal(false);
      router.push(`/product/${nextProductId}`);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    
    // Check if product is unavailable
    if (isUnavailable) {
      addToast(`This product is not available in ${selectedCurrency}`, 'error', 3000);
      return;
    }
    
    // Add click animation
    const button = e.target;
    button.classList.add('clicked');
    setTimeout(() => button.classList.remove('clicked'), 600);
    
    addToCart({
      ...product,
      price: numericCurrentPrice,
      displayPrice: numericCurrentPrice,
      originalPrice: numericOriginalPrice,
      displayOriginalPrice: numericOriginalPrice,
      currency: product.currency || currencySettings.currency,
      currencySymbol: product.currencySymbol || currencySettings.symbol || '₹',
      selectedColor: 'Default',
      selectedSize: 'One Size',
      quantity: 1
    }, product.stock);
    addToast(`${product.name} added to cart successfully!`, 'success', 4000);
  };

  const handleAddToCartFromModal = () => {
    if (requiresSizeSelection && !selectedSize) {
      addToast('Please select a size before adding to cart.', 'error', 3000);
      return;
    }

    addToCart({
      ...product,
      price: numericCurrentPrice,
      displayPrice: numericCurrentPrice,
      originalPrice: numericOriginalPrice,
      displayOriginalPrice: numericOriginalPrice,
      currency: product.currency || currencySettings.currency,
      currencySymbol: product.currencySymbol || currencySettings.symbol || '₹',
      selectedColor: selectedColor || product.colors?.[0] || 'Default',
      selectedSize: selectedSize || product.sizes?.[0] || 'One Size',
      quantity: quantity
    }, selectedSizeStock);

    addToast(`✅ ${product.name} added to cart successfully!`, 'success', 4000);
  };

  const handleViewDetails = (event) => {
    event.stopPropagation();
    setShowModal(false);
    const id = product._id || product.id;
    if (id) {
      router.push(`/product/${id}`);
    } else {
      goToCategory();
    }
  };

  const fadeCardImage = (nextSrc) => {
    if (!nextSrc || nextSrc === cardImageSrc) return;
    setCardPrevImageSrc(cardImageSrc);
    setCardImageSrc(nextSrc);
    setIsCardFading(true);
    window.setTimeout(() => {
      setCardPrevImageSrc(null);
      setIsCardFading(false);
    }, 350);
  };

  const handleCardMouseEnter = () => {
    if (!cardHoverImage || cardHoverImage === cardMainImage) return;
    fadeCardImage(cardHoverImage);
  };

  const handleCardMouseLeave = () => {
    if (cardImageSrc !== cardMainImage) {
      fadeCardImage(cardMainImage);
    }
  };

  const truncateDescription = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Mobile-specific truncation for 2 lines
  const truncateDescriptionMobile = (text) => {
    if (!text) return text;
    const words = text.split(' ');
    // Approximate 2 lines worth of text (about 12-15 words for 2 lines)
    if (words.length <= 15) return text;
    return words.slice(0, 15).join(' ') + '...';
  };

  return (
    <>
      {/* CARD */}
      <div
        className="card product-card h-100 shadow-sm"
        onClick={handleViewDetails}
      >
        <div
          className="product-card__image position-relative"
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
        >
          <img
            src={cardImageSrc || normalizeDriveImageUrl(product.image) || 'https://via.placeholder.com/500x500'}
            alt={product.name}
            loading="lazy"
            className="card-img-top card-img-base"
            onError={(e) => {
              const target = e.target;
              if (target && target.src && target.src.includes('drive.google.com/uc?export=view&id=')) {
                target.src = getDriveFallbackUrl(target.src);
              } else {
                target.src = 'https://via.placeholder.com/500x500';
              }
            }}
          />
          {cardPrevImageSrc && (
            <img
              src={cardPrevImageSrc}
              alt={product.name}
              className={`card-img-top card-img-fade ${isCardFading ? 'fade-out' : ''}`}
              onError={(e) => {
                const target = e.target;
                if (target && target.src && target.src.includes('drive.google.com/uc?export=view&id=')) {
                  target.src = getDriveFallbackUrl(target.src);
                } else {
                  target.src = 'https://via.placeholder.com/500x500';
                }
              }}
            />
          )}

          {/* NEW TAG */}
          {product.isNew && (
            <div className="badge-new-shine">
              NEW
            </div>
          )}

          {/* HOVER ICONS */}
          <div className="product-card__hover-actions">
            <button
              className="product-card__icon-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (product.colors?.length > 0 && product.sizes?.length > 0) {
                  if (directToProduct) {
                    handleViewDetails(e);
                  } else {
                    setShowModal(true);
                  }
                } else {
                  handleAddToCart(e);
                }
              }}
              title="Add to Cart"
            >
              <span className="add-to-cart-text">
                <span className="svg-wrapper add-to-cart-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M16.608 9.421V6.906H3.392v8.016c0 .567.224 1.112.624 1.513.4.402.941.627 1.506.627H8.63M8.818 3h2.333c.618 0 1.212.247 1.649.686a2.35 2.35 0 0 1 .683 1.658v1.562H6.486V5.344c0-.622.246-1.218.683-1.658A2.33 2.33 0 0 1 8.82 3" />
                    <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" d="M14.608 12.563v5m2.5-2.5h-5" />
                  </svg>
                </span>
                <span className="add-to-cart-text__content is-visually-hidden-mobile">
                  ADD
                </span>
              </span>
            </button>
            <button
              className="product-card__icon-btn"
              onClick={handleToggleFavorite}
              title="Add to Wishlist"
            >
              <i className={isFavorite ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
            </button>
            {!directToProduct && (
              <button
                className="product-card__icon-btn quick-view-btn"
                onClick={handleQuickView}
                title="Quick View"
              >
                <i className="fa-regular fa-eye"></i>
              </button>
            )}
          </div>

          {!directToProduct && (
            <button
              className="product-card__select-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (!isUnavailable) {
                  setShowModal(true);
                }
              }}
              disabled={isUnavailable}
              title={isUnavailable ? `Not available in ${selectedCurrency}` : 'Select options'}
            >
              {isUnavailable ? 'Unavailable' : 'Select options'}
            </button>
          )}
        </div>

        <div className="card-body">
          <h5>{product.name}</h5>
          <div className="product-card__price-row">
            <span className="product-card__price">{formattedPrice}</span>
            {showOriginalPrice && (
              <span className="product-card__original-price">{formattedOriginalPrice}</span>
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="quickview-modal" onClick={() => setShowModal(false)}>
          <div className="quickview-content" onClick={(e) => e.stopPropagation()}>
            <span
              className="close-btn"
              onClick={() => setShowModal(false)}
            >
              ✖
            </span>

            {/* 📸 IMAGE GALLERY SECTION */}
            <div className="quickview-gallery">
              {/* Main Image */}
              <img
                src={selectedQuickImage || normalizeDriveImageUrl(product.image) || 'https://via.placeholder.com/500x500'}
                alt={product.name}
                className="quickview-img"
                onError={(e) => {
                  const target = e.target;
                  if (target && target.src && target.src.includes('drive.google.com/uc?export=view&id=')) {
                    target.src = getDriveFallbackUrl(target.src);
                  } else {
                    target.src = 'https://via.placeholder.com/500x500';
                  }
                }}
              />

              {/* Thumbnails Row - Show max 4 items */}
              {quickViewImages.length > 1 && (
                <div className="quickview-thumbnails-container">
                  <div className="quickview-thumbnails-row">
                    {/* Show first 3 thumbnails normally */}
                    {quickViewImages.slice(0, 3).map((src, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`quickview-thumb ${selectedQuickImage === src ? 'selected' : ''}`}
                        onClick={() => setSelectedQuickImage(src)}
                        title={`View image ${index + 1}`}
                      >
                        <img
                          src={src || 'https://via.placeholder.com/100x100?text=Image'}
                          alt={`${product.name} ${index + 1}`}
                          onError={(e) => {
                            const target = e.target;
                            if (target && target.src && target.src.includes('drive.google.com/uc?export=view&id=')) {
                              target.src = getDriveFallbackUrl(target.src);
                            } else {
                              target.src = 'https://via.placeholder.com/100x100?text=Image';
                            }
                          }}
                        />
                      </button>
                    ))}

                    {/* Show blurred preview box if more than 4 images */}
                    {quickViewImages.length > 4 && (
                      <button
                        type="button"
                        className="quickview-thumb quickview-more-box"
                        onClick={handleViewDetails}
                        title="View all images"
                      >
                        <img
                          src={quickViewImages[3] || 'https://via.placeholder.com/100x100?text=Image'}
                          alt="More images preview"
                          className="quickview-more-bg"
                          onError={(e) => {
                            const target = e.target;
                            if (target && target.src && target.src.includes('drive.google.com/uc?export=view&id=')) {
                              target.src = getDriveFallbackUrl(target.src);
                            } else {
                              target.src = 'https://via.placeholder.com/100x100?text=Image';
                            }
                          }}
                        />
                        <div className="quickview-more-overlay">
                          <span>+{quickViewImages.length - 4}</span>
                          <small>More Images</small>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 📝 INFO SECTION */}
            <div className="quickview-info">
              <h3>{product.name}</h3>
              <div className="product-description">
                <p>
                  {descriptionExpanded 
                    ? product.description 
                    : (window.innerWidth <= 768 ? truncateDescriptionMobile(product.description) : truncateDescription(product.description))
                  }
                  {product.description && (
                    (window.innerWidth <= 768 ? product.description.split(' ').length > 15 : product.description.length > 150) && (
                      <span 
                        className="view-more-link" 
                        onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                        style={{ cursor: 'pointer', textDecoration: 'underline', color: '#007bff', marginLeft: '5px' }}
                      >
                        {descriptionExpanded ? 'View Less' : 'View More'}
                      </span>
                    )
                  )}
                </p>
              </div>

              <div className="d-flex gap-2 mb-3">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleViewDetails}
                >
                  View Details
                </button>
                {(product.showSameColorButton || product.showSimilarProductButton) && product.colors?.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-show-more-similar"
                    onClick={handleShowSimilarProducts}
                  >
                    View Similar Patterns
                  </button>
                )}
              </div>

              <div className="product-card__price-row quickview-price-row">
                <span className="product-card__price">{formattedPrice}</span>
                {showOriginalPrice && (
                  <span className="product-card__original-price">{formattedOriginalPrice}</span>
                )}
              </div>

              {/* {product.colors?.length > 0 && (
                <div className="quickview-options mb-3">
                  <span className="option-label">Color:</span>
                  <div className="color-box-list">
                    {product.colors.map((color, index) => (
                      <button
                        key={`${color}-${index}`}
                        type="button"
                        className={`color-box ${selectedColor === color ? 'selected' : ''}`}
                        onClick={() => setSelectedColor(color)}
                        title={color}
                        style={{ backgroundColor: getColorHex(color) }}
                      />
                    ))}
                  </div>
                </div>
              )} */}

{product.colors?.length > 0 && (
  <div className="quickview-options mb-3">
    <span className="option-label">Color:</span>
    <div className="color-box-list"> {/* Aap chahein toh class ka naam badal kar 'color-name-list' kar sakte hain */}
      {product.colors.map((color, index) => (
        <button
          key={`${color}-${index}`}
          type="button"
          className={`color-name-btn ${selectedColor === color ? 'selected' : ''}`}
          onClick={() => setSelectedColor(color)}
          title={color}
        >
          {color} {/* Yahan par admin se aane wala color ka naam text form me dikhega */}
        </button>
      ))}
    </div>
  </div>
)}
              {product.sizes?.length > 0 && (
                <div className="quickview-options mb-3">
                  <span className="option-label">Size:</span>
                  <div className="option-list">
                    {product.sizes.map((size) => {
                      const sizeStock = typeof product.stock === 'object' ? product.stock[size] : product.stock;
                      const inStock = sizeStock !== undefined ? sizeStock > 0 : product.stock > 0;
                      
                      return (
                        <button
                          key={size}
                          type="button"
                          className={`option-button ${selectedSize === size ? 'selected' : ''} ${!inStock ? 'disabled' : ''}`}
                          onClick={() => setSelectedSize(size)}
                          disabled={!inStock}
                          title={!inStock ? 'Out of stock' : ''}
                        >
                          {size} 
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-3 quantity-row">
                <div>
                  <p className="mb-2">
                    <strong>Quantity</strong>
                  </p>
                  <div className="input-group" style={{ maxWidth: '150px' }}>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || (requiresSizeSelection && !selectedSize)}
                    >
                      −
                    </button>
                    <input
                      type="text"
                      className="form-control text-center"
                      value={quantity}
                      readOnly
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        if (requiresSizeSelection && !selectedSize) return;
                        setQuantity(Math.min(selectedSizeStock, quantity + 1));
                      }}
                      disabled={requiresSizeSelection && !selectedSize || quantity >= selectedSizeStock}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 mb-3">
                <button
                  className="btn btn-dark flex-grow-1 add-to-cart-with-icon"
                  onClick={() => {
                    if (isUnavailable) {
                      addToast(`This product is not available in ${selectedCurrency}`, 'error', 3000);
                      return;
                    }
                    if (requiresSizeSelection && !selectedSize) {
                      addToast('Please select a size before adding to cart.', 'error', 3000);
                      return;
                    }

                    const button = document.activeElement;
                    if (button) {
                      button.classList.add('clicked');
                      setTimeout(() => button.classList.remove('clicked'), 600);
                    }

                    addToCart({
                      ...product,
                      price: numericCurrentPrice,
                      displayPrice: numericCurrentPrice,
                      originalPrice: numericOriginalPrice,
                      displayOriginalPrice: numericOriginalPrice,
                      currency: product.currency || currencySettings.currency,
                      currencySymbol: product.currencySymbol || currencySettings.symbol || '₹',
                      selectedColor: selectedColor || product.colors?.[0] || 'Default',
                      selectedSize: selectedSize || product.sizes?.[0] || 'One Size',
                      quantity: quantity
                    }, selectedSizeStock);
                    addToast(`✅ ${product.name} added to cart successfully!`, 'success', 4000);
                    setShowModal(false);
                  }}
                  disabled={isUnavailable || (requiresSizeSelection && !selectedSize)}
                >
                  <span className="svg-wrapper add-to-cart-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M16.608 9.421V6.906H3.392v8.016c0 .567.224 1.112.624 1.513.4.402.941.627 1.506.627H8.63M8.818 3h2.333c.618 0 1.212.247 1.649.686a2.35 2.35 0 0 1 .683 1.658v1.562H6.486V5.344c0-.622.246-1.218.683-1.658A2.33 2.33 0 0 1 8.82 3" />
                      <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" d="M14.608 12.563v5m2.5-2.5h-5" />
                    </svg>
                  </span>
                  {isUnavailable ? 'Not Available' : (requiresSizeSelection && !selectedSize ? 'Select Size First' : 'Add to Cart')}
                </button>
                <button className="btn btn-outline-secondary flex-grow-1" onClick={handleShare}>
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


