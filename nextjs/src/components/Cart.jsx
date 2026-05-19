'use client';

import React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useProductStore } from '../store/productStore';

const parsePrice = (price) => {
  const numeric = parseFloat(String(price).replace(/[^0-9.]/g, ''));
  return Number.isNaN(numeric) ? 0 : numeric;
};

// Format price with proper decimal places
const formatPrice = (price) => {
  if (!price && price !== 0) return '0.00';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, appliedCoupon, applyCoupon, removeCoupon, getDiscountedTotal } = useCartStore();
  const { user } = useAuthStore();
  const products = useProductStore((state) => state.products);
  const currencySettings = useProductStore((state) => state.currencySettings);
  const selectedCurrency = useProductStore((state) => state.selectedCurrency);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const router = useRouter();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  // Fetch products on component mount to ensure stock data is available
  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const currencyDecimals = selectedCurrency === 'KWD' ? 3 : 2;
  const currencySymbol = selectedCurrency === 'INR' ? '₹' : selectedCurrency === 'KWD' ? 'KWD' : currencySettings?.symbol || 'KWD';
  const subtotal = cart.reduce((sum, item) => sum + parsePrice(typeof item.displayPrice === 'number' ? item.displayPrice : item.price) * item.quantity, 0);
  const originalSubtotal = cart.reduce((sum, item) => {
    const unit = parsePrice(typeof item.displayOriginalPrice === 'number' ? item.displayOriginalPrice : item.originalPrice);
    return sum + (unit > 0 ? unit * item.quantity : 0);
  }, 0);
  const discount = Math.max(0, originalSubtotal - subtotal);
  const shipping = cart.length > 0 ? (selectedCurrency === 'INR' ? (currencySettings?.shippingPriceINR ?? 0) : (currencySettings?.shippingPriceKWD ?? currencySettings?.shippingPrice ?? 5)) : 0;
  const discountedSubtotal = getDiscountedTotal();
  const total = discountedSubtotal + shipping;

  const handleCheckout = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push('/checkout');
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.toUpperCase(), subtotal })
      });
      const data = await response.json();
      if (data.valid) {
        applyCoupon({ code: couponCode.toUpperCase(), discount: data.discount, description: data.description });
        setCouponCode('');
      } else {
        setCouponError(data.message);
      }
    } catch (error) {
      setCouponError('Failed to apply coupon');
    }
  };

  if (cart.length === 0) {
    return (
    <div className="container mx-auto px-4 py-5 text-center">
  <h2 className="text-3xl font-semibold mb-4">Your cart is empty</h2>

  <p className="text-gray-600 mb-6">
    Add products to your cart to see them here.
  </p>

  <Link
    href="/products"
    className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-white shadow hover:bg-gray-800 transition"
  >
    Continue shopping
  </Link>
</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-5">
      <h1 className="text-3xl font-semibold text-slate-900">Shopping Cart</h1>
      <p className="mt-2 text-sm text-slate-500">Home / Cart</p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[2fr_0.95fr]">
        <div className="lg:col-span-2">
          {cart.map((item, index) => {
            const itemId = item._id ?? item.id;
            const itemColor = item.selectedColor || 'Default';
            const itemSize = item.selectedSize || 'One Size';
            const uniqueKey = `${itemId}-${itemColor}-${itemSize}`;
            
            // Find the product to get stock information
            const product = products.find(p => String(p._id || p.id) === String(itemId));
            const maxStock = product?.stock || 1;
            
            return (
              <div key={uniqueKey} className="bg-white p-2 rounded-2xl shadow-sm mb-3 flex items-center gap-3 border border-slate-200">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-semibold text-slate-900 truncate flex-1 mr-2">{item.name}</h3>
                    <span className="text-xs text-slate-500 shrink-0">x {item.quantity}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-slate-500">Color: <strong className="text-slate-700">{itemColor}</strong></span>
                    <span className="text-[10px] text-slate-500">Size: <strong className="text-slate-700">{itemSize}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-medium text-slate-900">
                        {typeof item.displayPrice === 'number' ? item.displayPrice.toFixed(currencyDecimals) : parsePrice(item.price).toFixed(currencyDecimals)} {item.currencySymbol || currencySymbol}
                      </span>
                      
                      {(() => {
                        const original = parsePrice(typeof item.displayOriginalPrice === 'number' ? item.displayOriginalPrice : item.originalPrice);
                        const current = parsePrice(typeof item.displayPrice === 'number' ? item.displayPrice : item.price);
                        if (original > current) {
                          return (
                            <span className="text-[10px] text-rose-600 line-through ml-1">
                              {original.toFixed(currencyDecimals)} {item.currencySymbol || currencySymbol}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => updateQuantity(itemId, Math.max(1, item.quantity - 1), itemSize, itemColor, maxStock)}
                        className="h-6 w-6 rounded-md bg-slate-100 text-slate-700 transition hover:bg-slate-200 text-xs"
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span className="min-w-[1.5rem] text-center text-xs font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(itemId, Math.min(maxStock, item.quantity + 1), itemSize, itemColor, maxStock)}
                        className="h-6 w-6 rounded-md bg-slate-100 text-slate-700 transition hover:bg-slate-200 text-xs"
                        disabled={item.quantity >= maxStock}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(itemId, itemSize, itemColor)}
                  className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-50 shrink-0"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-24">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Coupon Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleApplyCoupon}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
            {couponError && <p className="mt-1 text-sm text-red-600">{couponError}</p>}
            {appliedCoupon && (
              <div className="mt-2 rounded-lg bg-green-50 p-3">
                <p className="text-sm text-green-800">Coupon applied: {appliedCoupon.description}</p>
                <button onClick={() => { removeCoupon(); setCouponCode(''); }} className="text-xs text-red-600 hover:underline">Remove</button>
              </div>
            )}
          </div>

          <div className="mb-6 rounded-3xl bg-slate-50 p-5 text-slate-700">
            <p className="text-sm font-medium text-slate-500">Order summary</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {total.toFixed(currencyDecimals)} {currencySymbol}
            </p>
            <p className="mt-2 text-sm text-slate-500">Shipping included.</p>
          </div>

          <div className="space-y-3 border-b border-slate-200 pb-5">
            {discount > 0 && (
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span className="font-medium">Original price</span>
                <span className="font-semibold line-through text-slate-400">{originalSubtotal.toFixed(currencyDecimals)} {currencySymbol}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span className="font-medium">Subtotal</span>
              <span className="font-semibold">{subtotal.toFixed(currencyDecimals)} {currencySymbol}</span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-sm text-emerald-600">
                <span className="font-medium">Discount Price</span>
                <span className="font-semibold">-{discount.toFixed(currencyDecimals)} {currencySymbol}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span className="font-medium">Shipping</span>
              <span className="font-semibold">
                {shipping.toFixed(currencyDecimals)} {currencySymbol}
              </span>
            </div>
            {appliedCoupon && (
              <div className="flex items-center justify-between text-sm text-emerald-600">
                <span className="font-medium">Coupon Discount</span>
                <span className="font-semibold">-{appliedCoupon.discount.toFixed(currencyDecimals)} {currencySymbol}</span>
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{total.toFixed(currencyDecimals)} {currencySymbol}</span>
          </div>

          <button
            onClick={handleCheckout}
            className="mt-6 w-full rounded-3xl bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white shadow hover:bg-[#0f8a3e] transition"
          >
            Proceed to Checkout
          </button>

          <button
            onClick={clearCart}
            className="mt-3 w-full rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            Clear Cart
          </button>
        </aside>
      </div>
    </div>
  );
}