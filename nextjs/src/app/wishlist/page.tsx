'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useCartStore } from '../../store/cartStore';
import { useProductStore } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import ProductSkeleton from '@/components/ProductSkeleton';
import './wishlist.css';

const subscribeHydration = () => () => {};
const getClientHydration = () => true;
const getServerHydration = () => false;

export default function Wishlist() {
  const hydrated = useSyncExternalStore(subscribeHydration, getClientHydration, getServerHydration);
  const { favorites, removeFromFavorites } = useFavoritesStore();
  const { addToCart } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const products = useProductStore((state) => state.products);
  const currencySettings = useProductStore((state) => state.currencySettings);
  const selectedCurrency = useProductStore((state) => state.selectedCurrency);
  const router = useRouter();
  const [shareModal, setShareModal] = useState(null);
  const [moveProduct, setMoveProduct] = useState(null);
  const [moveSize, setMoveSize] = useState('');
  const [moveColor, setMoveColor] = useState('');

  if (!hydrated) return <ProductSkeleton />;

  const getProductSymbol = (product) => {
    if (product?.currencySymbol) return product.currencySymbol;
    if (product?.currency === 'KWD') return 'KWD';
    if (product?.currency === 'INR') return '₹';
    return currencySettings?.symbol || (selectedCurrency === 'KWD' ? 'KWD' : '₹');
  };

  const formatCurrency = (value, symbol) => {
    const numeric = Number(value || 0);
    if (Number.isNaN(numeric)) return '';
    const decimals = symbol === 'KWD' ? 3 : 2;
    return `${symbol}${numeric.toFixed(decimals)}`;
  };

  const getProductPriceValue = (product) => product?.displayPrice ?? product?.price ?? 0;

  const handleShare = (product) => setShareModal(product);
  const closeShareModal = () => setShareModal(null);
  const shareOnWhatsApp = (product) => {
    const priceText = formatCurrency(getProductPriceValue(product), getProductSymbol(product));
    const productUrl = `${window.location.origin}/product/${product.id || product._id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} - ${priceText}\n${productUrl}`)}`, '_blank', 'noopener,noreferrer');
  };
  const shareOnInstagram = (product) => {
    const productUrl = `${window.location.origin}/product/${product.id || product._id}`;
    window.open(`https://www.instagram.com/?url=${encodeURIComponent(productUrl)}`, '_blank', 'noopener,noreferrer');
  };
  const copyLink = async (product) => {
    const productUrl = `${window.location.origin}/product/${product.id || product._id}`;
    await navigator.clipboard.writeText(productUrl);
    setShareModal(null);
  };

  const openMoveDialog = (product) => {
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const colors = Array.isArray(product.colors) ? product.colors : [];
    setMoveProduct(product);
    setMoveSize(sizes.length === 1 ? sizes[0] : '');
    setMoveColor(colors.length === 1 ? colors[0] : '');
  };

  const confirmMoveToCart = () => {
    if (!moveProduct) return;
    const sizes = Array.isArray(moveProduct.sizes) ? moveProduct.sizes : [];
    const colors = Array.isArray(moveProduct.colors) ? moveProduct.colors : [];
    if ((sizes.length > 1 && !moveSize) || (colors.length > 1 && !moveColor)) return;
    const selectedSize = moveSize || sizes[0] || 'One Size';
    const selectedColor = moveColor || colors[0] || 'Default';
    const sizeStock = typeof moveProduct.stock === 'object'
      ? Number(moveProduct.stock[selectedSize] ?? moveProduct.stock[selectedColor] ?? 1)
      : Number(moveProduct.stock ?? 1);
    const id = String(moveProduct.id || moveProduct._id);
    const previousQuantity = useCartStore.getState().cart
      .filter((item) => String(item.id || item._id) === id && (item.selectedSize || 'One Size') === selectedSize && (item.selectedColor || 'Default') === selectedColor)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    addToCart({
      ...moveProduct,
      price: moveProduct.displayPrice ?? moveProduct.price,
      displayPrice: moveProduct.displayPrice ?? moveProduct.price,
      quantity: 1,
      selectedColor,
      selectedSize
    }, Math.max(1, sizeStock));
    const addedQuantity = useCartStore.getState().cart
      .filter((item) => String(item.id || item._id) === id && (item.selectedSize || 'One Size') === selectedSize && (item.selectedColor || 'Default') === selectedColor)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    if (addedQuantity <= previousQuantity) return;
    removeFromFavorites(moveProduct.id || moveProduct._id);
    setMoveProduct(null);
    router.push('/cart');
  };

  return (
    <div className="container py-5 wishlist-container">
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-5 gap-3 wishlist-header">
        <div>
          <h1 className="fw-bold mb-1 wishlist-heading-text">My Wishlist <span className="text-muted fs-5 fw-normal">({favorites.length} items)</span></h1>
          <p className="text-muted mb-0">Your saved products appear here. Tap the heart again to remove them.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link href="/products" className="btn btn-light border">Continue shopping</Link>
        </div>
      </div>

      {/* Empty State */}
      {favorites.length === 0 ? (
        <div className="border rounded-4 p-5 text-center bg-light">
          <div className="mb-4">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </div>
          <h2 className="fw-bold mb-3">Your wishlist is empty</h2>
          <p className="mb-4 text-muted">Save your favorite pieces here and come back to them anytime.</p>
          <Link href="/products" className="btn btn-dark px-4 py-2">Continue Shopping</Link>
          {!user && <Link href="/login?redirect=/wishlist" className="btn btn-link ms-2">Login</Link>}
        </div>
      ) : (
        /* Grid System (Using pure Bootstrap row and cols for stability) */
        <div className="row g-3 g-md-4">
          {favorites.map((product) => {
            const productId = product.id || product._id;
            const currentProduct = products.find(item => String(item.id || item._id) === String(productId)) || product;
            const stockUnavailable = currentProduct.stock !== undefined && (
              typeof currentProduct.stock === 'object'
                ? Object.values(currentProduct.stock).every((stock) => Number(stock) <= 0)
                : Number(currentProduct.stock) <= 0
            );
            const isSoldOut = currentProduct.isSoldOut === true || currentProduct.isSoldOut === 'true' || currentProduct.isSoldOut === 1 || stockUnavailable;
            
            return (
              <div key={productId} className="col-6 col-sm-6 col-md-4 col-lg-3">
                <div className="card shadow-none h-100 wishlist-card position-relative">
                  
                  {/* Top Right: Remove Button */}
                  <button 
                    className="position-absolute top-0 end-0 m-2 action-btn-circle remove-btn z-2"
                    onClick={() => removeFromFavorites(productId)}
                    title="Remove from wishlist"
                    aria-label={`Remove ${product.name} from wishlist`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>

                  {/* Product Image with Fixed Aspect Ratio */}
                  <div className="product-image-wrapper">
                    {isSoldOut && <span className="wishlist-sold-out-badge">SOLD OUT</span>}
                    <Image
                      src={product.image || 'https://via.placeholder.com/400x533?text=Product'}
                      className="product-image"
                      alt={product.name}
                      fill
                      unoptimized
                    />
                  </div>

                  {/* Card Body */}
                  <div className="card-body d-flex flex-column p-3">
                    <h5 className="card-title-clamp wishlist-title mb-2">{product.name}</h5>
                    
                    <div className="mt-auto d-flex justify-content-between align-items-end">
                      <div>
                         <span className="badge bg-light  border mb-2">{product.category || 'Popular'}</span>
                         <h6 className="fw-bold mb-0 price-text">{formatCurrency(getProductPriceValue(product), getProductSymbol(product))}</h6>
                      </div>
                      <button className="wishlist-share-icon" type="button" onClick={() => handleShare(currentProduct)} aria-label={`Share ${product.name}`} title="Share product">↗</button>
                      <button className="wishlist-move-button" type="button" disabled={isSoldOut} onClick={() => openMoveDialog(currentProduct)}>
                        MOVE TO CART
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {moveProduct && (
        <div className="wishlist-dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setMoveProduct(null);
        }}>
          <section className="wishlist-dialog" role="dialog" aria-modal="true" aria-labelledby="move-dialog-title">
            <button type="button" className="wishlist-dialog-close" onClick={() => setMoveProduct(null)} aria-label="Close dialog">×</button>
            <Image src={moveProduct.image || '/placeholder.png'} alt={moveProduct.name || 'Product'} width={400} height={533} unoptimized />
            <div className="wishlist-dialog-content">
              <h2 id="move-dialog-title">{moveProduct.name}</h2>
              <strong>{formatCurrency(getProductPriceValue(moveProduct), getProductSymbol(moveProduct))}</strong>
              {Array.isArray(moveProduct.sizes) && moveProduct.sizes.length > 1 && (
                <fieldset>
                  <legend>Choose size</legend>
                  <div className="wishlist-choice-row">
                    {moveProduct.sizes.map((size) => {
                      const stock = typeof moveProduct.stock === 'object' ? Number(moveProduct.stock[size] || 0) : Number(moveProduct.stock || 1);
                      return <button type="button" key={size} disabled={stock <= 0} className={moveSize === size ? 'selected' : ''} onClick={() => setMoveSize(size)}>{size}</button>;
                    })}
                  </div>
                </fieldset>
              )}
              {Array.isArray(moveProduct.colors) && moveProduct.colors.length > 1 && (
                <fieldset>
                  <legend>Choose color</legend>
                  <div className="wishlist-choice-row">
                    {moveProduct.colors.map((color) => <button type="button" key={color} className={moveColor === color ? 'selected' : ''} onClick={() => setMoveColor(color)}>{color}</button>)}
                  </div>
                </fieldset>
              )}
              <button
                type="button"
                className="wishlist-add-cart-button"
                disabled={moveProduct.isSoldOut || (moveProduct.sizes?.length > 1 && !moveSize) || (moveProduct.colors?.length > 1 && !moveColor)}
                onClick={confirmMoveToCart}
              >ADD TO CART</button>
            </div>
          </section>
        </div>
      )}

      {/* Share Modal (Unchanged) */}
      {shareModal && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{ backdropFilter: 'blur(4px)', zIndex: 1040 }}
            onClick={closeShareModal}
          ></div>
          <div
            className="position-fixed top-50 start-50 translate-middle bg-white rounded-4 p-4 shadow-lg border-0"
            style={{ zIndex: 1050, maxWidth: '380px', width: '90%' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
               <h5 className="mb-0 fw-bold">Share Product</h5>
               <button className="btn-close" onClick={closeShareModal}></button>
            </div>
            
            <div className="d-flex justify-content-center gap-3 mb-4">
              <button className="btn btn-outline-danger rounded-circle p-3" style={{width: '56px', height: '56px'}} onClick={() => shareOnInstagram(shareModal)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </button>
              <button className="btn btn-outline-success rounded-circle p-3" style={{width: '56px', height: '56px'}} onClick={() => shareOnWhatsApp(shareModal)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </button>
              <button className="btn btn-outline-dark rounded-circle p-3" style={{width: '56px', height: '56px'}} onClick={() => copyLink(shareModal)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="m4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              </button>
            </div>
            <button className="btn btn-dark w-100 py-2 rounded-3" onClick={closeShareModal}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}