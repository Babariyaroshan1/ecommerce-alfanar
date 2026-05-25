// @ts-nocheck

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useCartStore } from '../../store/cartStore';
import { useProductStore } from '../../store/productStore';
import ProductSkeleton from '@/components/ProductSkeleton';
import './wishlist.css';

export default function Wishlist() {
  const { favorites, removeFromFavorites } = useFavoritesStore();
  const { addToCart } = useCartStore();
  const products = useProductStore((state) => state.products);
  const currencySettings = useProductStore((state) => state.currencySettings);
  const router = useRouter();
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [shareModal, setShareModal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBuyNow = () => {
    if (favorites.length === 1) {
      const product = products.find(p => String(p.id || p._id) === String(favorites[0].id || favorites[0]._id));
      const stock = product?.stock || 1;
      addToCart({
        ...favorites[0],
        price: favorites[0].displayPrice ?? favorites[0].price,
        displayPrice: favorites[0].displayPrice ?? favorites[0].price,
        currency: favorites[0].currency || currencySettings?.currency,
        currencySymbol: favorites[0].currencySymbol || currencySettings?.symbol || '₹',
        quantity: 1,
        selectedColor: 'Default',
        selectedSize: 'One Size'
      }, stock);
      router.push('/checkout');
    } else {
      selectedProducts.forEach(productId => {
        const product = favorites.find(p => String(p.id || p._id) === String(productId));
        const fullProduct = products.find(p => String(p.id || p._id) === String(productId));
        const stock = fullProduct?.stock || 1;
        if (product) {
          addToCart({
            ...product,
            price: product.displayPrice ?? product.price,
            displayPrice: product.displayPrice ?? product.price,
            currency: product.currency || currencySettings?.currency,
            currencySymbol: product.currencySymbol || currencySettings?.symbol || '₹',
            quantity: 1,
            selectedColor: 'Default',
            selectedSize: 'One Size'
          }, stock);
        }
      });
      router.push('/checkout');
    }
  };

  const handleShare = (product) => {
    setShareModal(product);
  };

  const closeShareModal = () => {
    setShareModal(null);
  };

  const shareOnWhatsApp = (product) => {
    const text = `Check out this product: ${product.name} - ₹${product.price}\n${window.location.origin}/product/${product.id || product._id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnInstagram = (product) => {
    const text = `Check out this product: ${product.name} - ₹${product.price}`;
    window.open(`https://www.instagram.com/?url=${encodeURIComponent(window.location.origin + '/product/' + (product.id || product._id))}`, '_blank');
  };

  const copyLink = async (product) => {
    const url = `${window.location.origin}/product/${product.id || product._id}`;
    await navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const selectedCount = favorites.length === 1 ? 1 : selectedProducts.size;

  const handleSelectAll = () => {
    if (selectedProducts.size === favorites.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(favorites.map(p => p.id || p._id)));
    }
  };

  if (loading) {
    return <ProductSkeleton />;
  }

  return (
    <div className="container py-5 wishlist-container">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-4 gap-3 wishlist-header">
        <div>
          <h2 className="fw-bold">Liked Products</h2>
          <p className="text-muted mb-0">Your saved products appear here. Tap the heart again to remove them.</p>
        </div>
        <div className="d-flex gap-2">
          {favorites.length > 1 && (
            <button
              className="btn btn-outline-primary"
              onClick={handleSelectAll}
            >
              {selectedProducts.size === favorites.length ? 'Deselect All' : 'Select All Products'}
            </button>
          )}
          <Link href="/products" className="btn btn-outline-dark">Continue shopping</Link>
          {favorites.length > 0 && (
            <button
              className="btn btn-dark"
              onClick={handleBuyNow}
              disabled={favorites.length > 1 && selectedCount === 0}
            >
              {favorites.length === 1 ? 'Buy Now' : `Proceed to Buy (${selectedCount} item${selectedCount !== 1 ? 's' : ''})`}
            </button>
          )}
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="border rounded-3 p-5 text-center">
          <p className="mb-3 text-muted">You haven't liked any products yet.</p>
          <Link href="/" className="btn btn-dark">Browse collections</Link>
        </div>
      ) : (
        <div className="row g-3 wishlist-grid">
          {favorites.map((product) => {
            const productId = product.id || product._id;
            const isSelected = selectedProducts.has(productId);
            return (
              <div key={productId} className="col-12 col-sm-6 col-md-4 col-lg-3">
                <div className="card shadow-sm h-100">
                  {favorites.length > 1 && (
                    <div className="position-absolute top-0 start-0 p-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={isSelected}
                        onChange={() => handleSelectProduct(productId)}
                      />
                    </div>
                  )}
                  <img
                    src={product.image || 'https://via.placeholder.com/400x400?text=Product'}
                    className="card-img-top"
                    alt={product.name}
                    style={{ objectFit: 'cover', height: '180px' }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{product.name}</h5>
                    <p className="text-muted mb-2">₹{product.price}</p>
                    <div className="mt-auto d-flex justify-content-between align-items-center">
                      <span className="badge bg-light text-dark">{product.category || 'Popular'}</span>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleShare(product)}
                        >
                          Share
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeFromFavorites(productId)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Modal */}
      {shareModal && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{ backdropFilter: 'blur(5px)', zIndex: 1040 }}
            onClick={closeShareModal}
          ></div>
          <div
            className="position-fixed top-50 start-50 translate-middle bg-white rounded-3 p-4 shadow-lg"
            style={{ zIndex: 1050, maxWidth: '400px', width: '90%' }}
          >
            <h5 className="text-center mb-3">Share Product</h5>
            <div className="d-flex justify-content-center gap-3 mb-3">
              <button className="btn btn-outline-primary" onClick={() => shareOnInstagram(shareModal)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </button>
              <button className="btn btn-outline-success" onClick={() => shareOnWhatsApp(shareModal)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </button>
              <button className="btn btn-outline-secondary" onClick={() => copyLink(shareModal)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                  <path d="m4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
              </button>
            </div>
            <button className="btn btn-secondary w-100" onClick={closeShareModal}>Close</button>
          </div>
        </>
      )}
    </div>
  );
}