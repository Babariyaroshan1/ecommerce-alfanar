'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/cartStore';
import { useProductStore } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import { useFavoritesStore } from '../../store/favoritesStore';
import CartSkeleton from '@/components/CartSkeleton';
import CheckoutProgress from '@/components/CheckoutProgress';
import CouponForm from '@/components/CouponForm';
import '../../components/Cart.css';

const productKey = (item) => `${item._id ?? item.id}-${item.selectedColor || 'Default'}-${item.selectedSize || 'One Size'}`;
const parsePrice = (value) => Number(String(value ?? 0).replace(/[^0-9.]/g, '')) || 0;
const subscribeHydration = () => () => {};
const getClientHydration = () => true;
const getServerHydration = () => false;

export default function Cart() {
  const hydrated = useSyncExternalStore(subscribeHydration, getClientHydration, getServerHydration);
  const { cart, removeFromCart, updateQuantity, updateOptions, clearCart, appliedCoupon } = useCartStore();
  const products = useProductStore((state) => state.products);
  const { user } = useAuthStore();
  const addToFavorites = useFavoritesStore((state) => state.addToFavorites);
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const currencySettings = useProductStore((state) => state.currencySettings);
  const selectedCurrency = useProductStore((state) => state.selectedCurrency);
  const decimals = selectedCurrency === 'KWD' ? 3 : 2;
  const currencySymbol = selectedCurrency === 'INR' ? '₹' : selectedCurrency === 'KWD' ? 'KWD' : currencySettings?.symbol || '₹';
  const shippingPrice = selectedCurrency === 'INR'
    ? (currencySettings?.shippingPriceINR ?? 0)
    : (currencySettings?.shippingPriceKWD ?? currencySettings?.shippingPrice ?? 5);
  const subtotal = cart.reduce((sum, item) => sum + parsePrice(item.displayPrice ?? item.price) * Number(item.quantity || 1), 0);
  const mrp = cart.reduce((sum, item) => sum + parsePrice(item.displayOriginalPrice ?? item.originalPrice ?? item.displayPrice ?? item.price) * Number(item.quantity || 1), 0);
  const discount = Math.max(0, mrp - subtotal);
  const shipping = cart.length ? shippingPrice : 0;
  const couponDiscount = Math.max(0, Number(appliedCoupon?.discount) || 0);
  const total = Math.max(0, subtotal - couponDiscount) + shipping;
  const activeSelectedItems = selectedItems.filter((key) => cart.some((item) => productKey(item) === key));
  const selectedSubtotal = cart.reduce(
    (sum, item) => activeSelectedItems.includes(productKey(item)) ? sum + parsePrice(item.displayPrice ?? item.price) * Number(item.quantity || 1) : sum,
    0
  );
  const format = (value) => `${currencySymbol}${Number(value || 0).toFixed(decimals)}`;

  const getItemMaxStock = (item, size = item.selectedSize, color = item.selectedColor) => {
    const product = products.find((entry) => String(entry._id ?? entry.id) === String(item._id ?? item.id));
    const stock = product?.stock ?? item.stock;
    const value = stock && typeof stock === 'object'
      ? stock[size || 'One Size'] ?? stock[color || 'Default'] ?? 1
      : stock ?? 1;
    return Math.max(1, Number(value) || 1);
  };

  const handleCheckout = () => router.push(user ? '/checkout' : '/login?redirect=/checkout');
  const toggleItem = (key) => setSelectedItems(activeSelectedItems.includes(key)
    ? activeSelectedItems.filter((item) => item !== key)
    : [...activeSelectedItems, key]);
  const toggleAll = () => setSelectedItems(activeSelectedItems.length === cart.length ? [] : cart.map(productKey));
  const moveToWishlist = (item) => {
    addToFavorites(item);
    removeFromCart(item._id ?? item.id, item.selectedSize, item.selectedColor);
  };

  if (!hydrated) return <CartSkeleton />;

  if (cart.length === 0) {
    return (
      <main className="cart-page cart-empty-page">
        <CheckoutProgress active="bag" />
        <section className="empty-cart">
          <h1>MY BAG (0 Items)</h1>
          <p>Your bag is waiting for something you love.</p>
          <Link href="/products" className="continue-shopping">CONTINUE SHOPPING</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <CheckoutProgress active="bag" />
      <div className="cart-container">
        <h1 className="cart-page-title">My Bag <span>({cart.length} {cart.length === 1 ? 'item' : 'items'})</span></h1>
        <div className="cart-content">
          <section className="cart-items-column" aria-label="Items in your bag">
            <div className="cart-selection-toolbar">
              <label className="cart-select-all">
                <input type="checkbox" checked={activeSelectedItems.length === cart.length} onChange={toggleAll} aria-label="Select all items" />
                <span>Select all ({activeSelectedItems.length}/{cart.length})</span>
              </label>
              <span className="cart-selected-subtotal">Selected: <strong>{format(selectedSubtotal)}</strong></span>
              <Link href="/wishlist" className="cart-toolbar-link">♡ Wishlist</Link>
              <button type="button" className="cart-toolbar-link cart-clear-link" onClick={clearCart}>Clear bag</button>
            </div>

            {cart.map((item) => {
              const itemId = item._id ?? item.id;
              const itemKey = productKey(item);
              const maxStock = getItemMaxStock(item);
              const variantProduct = products.find((product) => String(product._id ?? product.id) === String(itemId)) || item;
              const sizes = Array.isArray(variantProduct.sizes) ? variantProduct.sizes : [];
              const colors = Array.isArray(variantProduct.colors) ? variantProduct.colors : [];
              const itemPrice = parsePrice(item.displayPrice ?? item.price);
              const itemMrp = parsePrice(item.displayOriginalPrice ?? item.originalPrice);
              return (
                <article className="cart-item" key={itemKey}>
                  <input
                    type="checkbox"
                    className="cart-item-checkbox"
                    checked={activeSelectedItems.includes(itemKey)}
                    onChange={() => toggleItem(itemKey)}
                    aria-label={`Select ${item.name}`}
                  />
                  <Image className="cart-item-image" src={item.image || '/placeholder.png'} alt={item.name || 'Product'} width={112} height={128} unoptimized />
                  <div className="cart-item-details">
                    <div className="cart-item-heading">
                      <div>
                        <h2>{item.name}</h2>
                        <p>{item.category || item.subtitle || 'Fashion'}</p>
                      </div>
                      <div className="cart-item-price">
                        <strong>{format(itemPrice)}</strong>
                        {itemMrp > itemPrice && <del>{format(itemMrp)}</del>}
                        <small>Inclusive of all taxes</small>
                      </div>
                    </div>
                    <div className="cart-item-options">
                      <label>Size
                        {sizes.length > 1 ? (
                          <select
                            value={item.selectedSize || 'One Size'}
                            onChange={(event) => updateOptions(itemId, item.selectedSize || 'One Size', item.selectedColor || 'Default', event.target.value, item.selectedColor || 'Default', getItemMaxStock(item, event.target.value, item.selectedColor))}
                            aria-label={`Size for ${item.name}`}
                          >
                            {sizes.map((size) => <option key={size} value={size}>{size}</option>)}
                          </select>
                        ) : <span>{item.selectedSize || sizes[0] || 'One Size'}</span>}
                      </label>
                      {colors.length > 1 && (
                        <label>Color
                          <select
                            value={item.selectedColor || 'Default'}
                            onChange={(event) => updateOptions(itemId, item.selectedSize || 'One Size', item.selectedColor || 'Default', item.selectedSize || 'One Size', event.target.value, getItemMaxStock(item, item.selectedSize, event.target.value))}
                            aria-label={`Color for ${item.name}`}
                          >
                            {colors.map((color) => <option key={color} value={color}>{color}</option>)}
                          </select>
                        </label>
                      )}
                      <label>Qty
                        <select
                          value={item.quantity}
                          onChange={(event) => updateQuantity(itemId, Number(event.target.value), item.selectedSize, item.selectedColor, maxStock)}
                          aria-label={`Quantity for ${item.name}`}
                        >
                          {Array.from({ length: maxStock }, (_, index) => index + 1).map((qty) => <option key={qty}>{qty}</option>)}
                        </select>
                      </label>
                      <span className="cart-delivery-estimate">Estimated delivery: 3–7 days</span>
                    </div>
                    <div className="cart-item-actions">
                      <button type="button" onClick={() => removeFromCart(itemId, item.selectedSize, item.selectedColor)}>REMOVE</button>
                      <button type="button" onClick={() => moveToWishlist(item)}>MOVE TO WISHLIST</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="cart-summary">
            <CouponForm subtotal={subtotal} title="Available coupons" />
            <h2>Price Details</h2>
            <div className="cart-summary-row"><span>Total MRP</span><span>{format(mrp)}</span></div>
            {discount > 0 && <div className="cart-summary-row cart-saving"><span>Bag discount</span><span>−{format(discount)}</span></div>}
            {couponDiscount > 0 && <div className="cart-summary-row cart-saving"><span>Coupon discount</span><span>−{format(couponDiscount)}</span></div>}
            <div className="cart-summary-row"><span>Shipping</span><span>{shipping ? format(shipping) : 'FREE'}</span></div>
            <button className="cart-details-toggle" type="button" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen}>
              {detailsOpen ? 'Hide price details' : 'View price details'}
            </button>
            {detailsOpen && <div className="cart-summary-row"><span>Subtotal</span><span>{format(subtotal)}</span></div>}
            <div className="cart-total-row"><strong>Payable total</strong><strong>{format(total)}</strong></div>
            {discount > 0 && <p className="cart-savings-banner">You save {format(discount)} on this bag</p>}
            <div className="cart-trust-points">
              <span>✓ Secure checkout</span><span>↻ Easy returns</span><span>□ Reliable delivery</span>
            </div>
            <button className="cart-checkout-button" type="button" onClick={handleCheckout}>CONTINUE TO CHECKOUT</button>
          </aside>
        </div>
      </div>
      <div className="cart-sticky-checkout">
        <button type="button" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen}>
          <small>Payable total</small><strong>{format(total)}</strong><span>View details</span>
        </button>
        <button type="button" onClick={handleCheckout}>CHECKOUT</button>
      </div>
    </main>
  );
}
