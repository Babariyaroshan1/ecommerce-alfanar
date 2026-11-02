'use client';

import { useState } from 'react';
import axios from 'axios';
import { useCartStore } from '../store/cartStore';
import './CouponForm.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function CouponForm({ subtotal, title = 'Have a coupon?' }) {
  const { appliedCoupon, applyCoupon, removeCoupon } = useCartStore();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);

  const handleApply = async (event) => {
    event.preventDefault();
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      setMessage('Enter a coupon code.');
      setHasError(true);
      return;
    }

    setLoading(true);
    setMessage('');
    setHasError(false);
    try {
      const response = await axios.post(`${API_URL}/coupons/validate`, { code: normalizedCode, subtotal });
      if (!response.data?.valid || !Number.isFinite(Number(response.data.discount))) {
        setMessage('This coupon could not be applied.');
        setHasError(true);
        return;
      }
      applyCoupon({ ...response.data, code: normalizedCode });
      setCode('');
      setMessage(response.data.description || 'Coupon applied.');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to validate this coupon. Please try again.');
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="coupon-form">
      <button type="button" className="coupon-form-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span>{title}</span><span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="coupon-form-content">
          {appliedCoupon && (
            <div className="coupon-applied">
              <span><strong>{appliedCoupon.code}</strong> applied</span>
              <button type="button" onClick={() => { removeCoupon(); setMessage('Coupon removed.'); setHasError(false); }}>Remove</button>
            </div>
          )}
          <form onSubmit={handleApply}>
            <label className="coupon-code-label">
              Coupon code
              <input value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" />
            </label>
            <button type="submit" disabled={loading || !code.trim()}>{loading ? 'Applying…' : 'Apply'}</button>
          </form>
          {message && <p className={hasError ? 'coupon-error' : 'coupon-success'} role={hasError ? 'alert' : 'status'}>{message}</p>}
        </div>
      )}
    </section>
  );
}
