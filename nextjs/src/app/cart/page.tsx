// @ts-nocheck

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/cartStore';
import { useProductStore } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import CartSkeleton from '@/components/CartSkeleton';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCartStore();
  const products = useProductStore((state) => state.products);
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [loading, setLoading] = useState(cart.length === 0);

  useEffect(() => {
    if (cart.length > 0) {
      setLoading(false);
    } else {
      const timer = setTimeout(() => setLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cart.length]);

  const currencySettings = useProductStore((state) => state.currencySettings);
  const selectedCurrency = useProductStore((state) => state.selectedCurrency);
  const parsePrice = (value: any) => Number(String(value || 0).replace(/[^0-9.]/g, '')) || 0;
  const currencyDecimals = selectedCurrency === 'KWD' ? 3 : 2;
  const currencySymbol = selectedCurrency === 'INR' ? '₹' : selectedCurrency === 'KWD' ? 'KWD' : currencySettings?.symbol || 'KWD';
  const shippingPrice = selectedCurrency === 'INR'
    ? (currencySettings?.shippingPriceINR ?? 0)
    : (currencySettings?.shippingPriceKWD ?? currencySettings?.shippingPrice ?? 5);

  const subtotal = cart.reduce((sum: number, item: any) => {
    const price = parsePrice(item.displayPrice ?? item.price);
    return sum + price * item.quantity;
  }, 0);

  const originalSubtotal = cart.reduce((sum: number, item: any) => {
    const original = parsePrice(item.displayOriginalPrice ?? item.originalPrice);
    return sum + (original > 0 ? original * item.quantity : 0);
  }, 0);

  const discount = Math.max(0, originalSubtotal - subtotal);
  const shipping = cart.length ? shippingPrice : 0;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push('/checkout');
  };

  if (cart.length === 0) {
    return (
    <div className="container mx-auto px-4 py-5 text-center">
  <h2 className="text-3xl font-semibold mb-4 cart-heading-text">Your cart is empty</h2>

  <p className="cart-muted-text mb-6">
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

  if (loading) {
    return <CartSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-5">
      <h1 className="text-3xl font-semibold cart-heading-text">Shopping Cart</h1>
      <p className="mt-2 text-sm cart-muted-text">Home / Cart</p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[2fr_0.95fr]">

        <section className="space-y-3">
          {cart.map((item: any) => {
            const itemId = item._id ?? item.id;

            // FIX: size & color handling
            const itemColor = item.selectedColor || 'Default';
            const itemSize = item.selectedSize || 'One Size';

            return (
              <article
                key={`${itemId}-${itemColor}-${itemSize}`} //   UNIQUE KEY
                className="overflow-hidden rounded-3xl border shadow-sm transition hover:shadow-md cart-card mb-3"
              >
                <div className="flex flex-col gap-2 p-2 sm:flex-row sm:items-center">
                 <img
                    src={item.image}
                    alt={item.name}
                    className="w-32 h-32 sm:w-30 sm:h-30 object-contain rounded-xl shrink-0"
                />

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold cart-heading-text line-clamp-2">
                          {item.name}
                        </h2>

                        {/* <p className="mt-1 text-xs cart-muted-text">
                          {item.description || ''}
                        </p> */}

                        {/* SHOW COLOR & SIZE */}
                        <p className="text-xs cart-muted-text">
                          Color: <strong>{itemColor}</strong>
                        </p>
                        <p className="text-xs cart-muted-text">
                          Size: <strong>{itemSize}</strong>
                        </p>
                      </div>

                      <div className="mt-2 flex items-center gap-3 cart-surface-text sm:max-w-[220px]">
                        <div className="flex-1">
                          <p className="uppercase tracking-[0.25em] cart-muted-text">
                            Unit price
                          </p>
                          <p className="mt-1 text-sm font-semibold cart-surface-text">
                            {parsePrice(item.displayPrice ?? item.price).toFixed(currencyDecimals)} {item.currencySymbol || currencySettings?.symbol || 'KWD'}
                          </p>
                        </div>
                        {(() => {
                          const original = parsePrice(item.displayOriginalPrice ?? item.originalPrice);
                          const current = parsePrice(item.displayPrice ?? item.price);
                          if (original > current) {
                            return (
                              <div className="text-right">
                                <p className="uppercase tracking-[0.25em] cart-muted-text">
                                  Original
                                </p>
                                <p className="mt-1 text-sm font-semibold cart-muted-text line-through">
                                  {original.toFixed(currencyDecimals)} {item.currencySymbol || currencySettings?.symbol || 'KWD'}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">

                      {/* QUANTITY FIX */}
                      <div className="inline-flex items-center rounded-2xl cart-quantity-panel px-2 py-1 text-sm cart-surface-text">
                        <button
                          onClick={() =>
                            updateQuantity(itemId, item.quantity - 1, itemSize, itemColor)
                          }
                          className="h-8 w-8 rounded-lg cart-btn cart-btn-square"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>

                        <span className="mx-2 min-w-[1.5rem] text-center text-sm font-medium cart-surface-text">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => {
                            const product = products.find(p => String(p._id || p.id) === String(itemId));
                            const maxStock = product?.stock || item.stock || 1;
                            updateQuantity(itemId, Math.min(item.quantity + 1, maxStock), itemSize, itemColor, maxStock);
                          }}
                          className="h-8 w-8 rounded-lg cart-btn cart-btn-square"
                          disabled={(() => {
                            const product = products.find(p => String(p._id || p.id) === String(itemId));
                            const maxStock = product?.stock || item.stock || 1;
                            return item.quantity >= maxStock;
                          })()}
                        >
                          +
                        </button>
                      </div>

                      {/* REMOVE FIX */}
                      <button
                        onClick={() =>
                          removeFromCart(itemId, itemSize, itemColor)
                        }
                        className="rounded-full border cart-btn cart-remove-btn px-3 py-1 text-xs font-semibold transition"
                      >
                        Remove
                      </button>

                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* RIGHT SIDE SAME */}
        <aside className="rounded-3xl border p-4 shadow-sm xl:sticky xl:top-24 cart-summary">
          <div className="mb-4 rounded-2xl cart-panel p-3 cart-surface-text">
            <p className="text-sm font-medium cart-muted-text">Order summary</p>
            <p className="mt-2 text-2xl font-semibold cart-surface-text">
              {total.toFixed(currencyDecimals)} {currencySymbol}
            </p>
          </div>

          <div className="space-y-3 cart-summary-section pb-4 px-4">
            {discount > 0 && (
              <div className="flex items-center justify-between py-2">
                <span className="font-medium cart-surface-text">Original price</span>
                <span className="font-semibold cart-muted-text line-through">
                  {originalSubtotal.toFixed(currencyDecimals)} {currencySymbol}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="font-medium cart-surface-text">Subtotal</span>
              <span className="font-semibold cart-surface-text">
                {subtotal.toFixed(currencyDecimals)} {currencySymbol}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between py-2 text-emerald-600">
                <span className="font-medium cart-surface-text">Discount Price</span>
                <span className="font-semibold">
                  -{discount.toFixed(currencyDecimals)} {currencySymbol}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="font-medium cart-surface-text">Shipping</span>
              <span className="font-semibold cart-surface-text">
                {shipping.toFixed(currencyDecimals)} {currencySymbol}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl cart-panel px-3 py-3 text-sm font-semibold cart-surface-text">
            <span>Total</span>
            <span>{total.toFixed(currencyDecimals)} {currencySymbol}</span>
          </div>

          <button
            onClick={handleCheckout}
            className="mt-5 w-full rounded-3xl bg-[#16a34a] px-5 py-3 text-sm font-semibold text-white shadow hover:bg-[#0f8a3e] transition"
          >
            Proceed to Checkout
          </button>

          <button
            onClick={clearCart}
            className="mt-3 w-full rounded-3xl cart-clear-btn px-5 py-3 text-sm font-semibold shadow-sm transition"
          >
            Clear Cart
          </button>
        </aside>

      </div>
    </div>
  );
}




