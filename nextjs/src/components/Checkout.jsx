'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useProductStore } from '../store/productStore';
import '../components/Checkout.css';
import { useTranslation } from 'react-i18next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production

const parsePrice = (price) => {
  const numeric = parseFloat(String(price).replace(/[^0-9.]/g, ''));
  return Number.isNaN(numeric) ? 0 : numeric;
};

export default function Checkout() {
  const { user, token } = useAuthStore();
  const { cart, clearCart, appliedCoupon, getDiscountedTotal } = useCartStore();
  const currencySettings = useProductStore((state) => state.currencySettings);
  const selectedCurrency = useProductStore((state) => state.selectedCurrency);
  const router = useRouter();
  const { t } = useTranslation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user || !token) {
      router.push('/login?redirect=/checkout');
      return;
    }
  }, [user, token, router]);

  // If not authenticated, show loading or redirect message
  if (!user || !token) {
    return (
      <div className="checkout-wrapper">
        <div className="checkout-container">
          <div style={{textAlign: 'center', padding: '2rem'}}>
            <h2>{t("Please login to continue with checkout")}</h2>
            <p>{t("Redirecting to login page...")}</p>
          </div>
        </div>
      </div>
    );
  }

  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');

  const[formData, setFormData] = useState({
    name: '',
    phone: '',
    houseNumber: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    latitude: null,
    longitude: null,
    mapLink: ''
  });

  useEffect(() => {
    setMounted(true);

    const savedData = localStorage.getItem('registerFormData');
    let savedForm = {};

    try {
      savedForm = savedData ? JSON.parse(savedData) : {};
    } catch {
      savedForm = {};
    }

    setFormData({
      name: user?.name || savedForm.name || '',
      phone: user?.phone || savedForm.phone || '',
      houseNumber: user?.address?.houseNumber || savedForm.houseNumber || '',
      street: user?.address?.street || savedForm.street || '',
      city: user?.address?.city || savedForm.city || '',
      state: user?.address?.state || savedForm.state || '',
      pincode: user?.address?.pincode || savedForm.pincode || '',
      latitude: user?.address?.latitude || null,
      longitude: user?.address?.longitude || null,
      mapLink: user?.address?.mapLink || ''
    });

  }, [user, token]);

  const currencyDecimals = selectedCurrency === 'KWD' ? 3 : 2;
  const currencySymbol = selectedCurrency === 'INR' ? '₹' : selectedCurrency === 'KWD' ? 'KWD' : currencySettings?.symbol || '₹';
  const subtotal = cart.reduce((sum, item) => sum + parsePrice(typeof item.displayPrice === 'number' ? item.displayPrice : item.price) * item.quantity, 0);
  const originalSubtotal = cart.reduce((sum, item) => {
    const unit = parsePrice(typeof item.displayOriginalPrice === 'number' ? item.displayOriginalPrice : item.originalPrice);
    return sum + (unit > 0 ? unit * item.quantity : 0);
  }, 0);
  const discount = Math.max(0, originalSubtotal - subtotal);
  const shipping = cart.length ? (selectedCurrency === 'INR' ? (currencySettings?.shippingPriceINR ?? 0) : (currencySettings?.shippingPriceKWD ?? currencySettings?.shippingPrice ?? 5)) : 0;
  const discountedSubtotal = getDiscountedTotal();
  const total = discountedSubtotal + shipping;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🔥 NEW: Geolocation Handler
  const handleUseCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude,
          mapLink
        }));
        
        setLocationLoading(false);
      },
      (error) => {
        let errorMsg = 'Failed to get location';
        if (error.code === 1) {
          errorMsg = 'Please enable location permission in your browser settings';
        } else if (error.code === 2) {
          errorMsg = 'Location data is currently unavailable';
        } else if (error.code === 3) {
          errorMsg = 'Location request timed out - please try again or enable location services';
        }
        setLocationError(errorMsg);
        setLocationLoading(false);
      },
      { timeout: 30000 }
    );
  };

  // UPI Validation
  const validateUpiId = (upi) => {
    // UPI format: username@bankname (e.g., user@okhdfcbank)
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/;
    return upiRegex.test(upi);
  };

  const handleUpiChange = (e) => {
    const value = e.target.value;
    setUpiId(value);
    
    if (value && !validateUpiId(value)) {
      setUpiError('Invalid UPI ID. Use format: username@bankname');
    } else {
      setUpiError('');
    }
  };

  const handlePaymentMethodSelect = (method) => {
    if (method === 'upi') {
      setSelectedPaymentMethod('upi');
      setUpiError('');
      setUpiId('');
    } else {
      setSelectedPaymentMethod(method);
      setUpiId('');
      setUpiError('');
    }
  };

  const handleOpenPaymentModal = (e) => {
    e.preventDefault();
    
    // Validate address fields
    if (!formData.name || !formData.phone || !formData.houseNumber || !formData.street || !formData.city || !formData.pincode) {
      alert('Please fill in all address fields');
      return;
    }

    // Validate cart
    if (!cart || cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    // Validate total
    if (!total || total <= 0) {
      alert('Invalid cart total');
      return;
    }

    setShowPaymentModal(true);
  };

  // 🔥 Triggered from inside the modal
  const executePayment = async (selectedMethod) => {
    // Validate UPI if selected
    if (selectedMethod === 'upi') {
      if (!upiId.trim()) {
        setUpiError('Please enter your UPI ID');
        return;
      }
      if (!validateUpiId(upiId)) {
        setUpiError('Invalid UPI ID. Use format: username@bankname');
        return;
      }
    }

    setLoading(true);
    setShowPaymentModal(false);

    try {
      const orderData = {
        items: cart,
        totalAmount: total,
        shippingAddress: formData,
        paymentMethod: selectedMethod === 'upi' ? 'online' : selectedMethod,
        currency: selectedCurrency || currencySettings?.currency || 'INR',
        currencySymbol,
        coupon: appliedCoupon ? { code: appliedCoupon.code, discount: appliedCoupon.discount, description: appliedCoupon.description } : null
      };

      // Log what's being sent
      console.log('Sending order data:', {
        items: cart.length,
        totalAmount: total,
        paymentMethod: orderData.paymentMethod,
        shippingAddress: formData
      });

      // Add UPI ID to order if using UPI
      if (selectedMethod === 'upi') {
        orderData.upiId = upiId;
      }

      const orderRes = await axios.post(
        `${API_URL}/orders`,
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const orderId = orderRes.data.order._id;

      if (selectedMethod === 'cod') {
        clearCart();
        setUpiId('');
        router.push(`/order/${orderId}`);
        return;
      }

      // For UPI: Show success message and redirect
      if (selectedMethod === 'upi') {
        clearCart();
        setUpiId('');
        router.push(`/order/${orderId}`);
        return;
      }

      // Online (Razorpay) Flow - if needed in future
      const paymentRes = await axios.post(
        `${API_URL}/payment/create-order`,
        { orderId, amount: total },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const razorpay = new window.Razorpay({
        key: 'YOUR_RAZORPAY_KEY_ID',
        amount: total * 100,
        currency: 'INR',
        order_id: paymentRes.data.id,
        handler: async (res) => {
          await axios.post(
            `${API_URL}/payment/verify`,
            { ...res, orderId },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          clearCart();
          setUpiId('');
          router.push(`/order/${orderId}`);
        }
      });

      razorpay.open();

    } catch (err) {
      console.error('Order creation error:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-wrapper">
      <div className="checkout-container">
        <h1 className="checkout-title">{t("Checkout")}</h1>

        <div className="checkout-grid">

          {/* LEFT - ADDRESS */}
          <div className="card">
            <form className="form" onSubmit={handleOpenPaymentModal}>
              <div className="full-width">
                <h2>{t("Shipping Address")}</h2>
              </div>

              <input name="name" value={formData.name} onChange={handleChange} placeholder={t("Full Name")} required />
              <input name="phone" value={formData.phone} onChange={handleChange} placeholder={t("Phone Number")} required />

              <div style={{display: 'grid', gridTemplateColumns: '1.5fr 2fr', gap: '10px', width: '100%', alignItems: 'start'}}>
                <div>
                  <label style={{fontSize: '12px', color: '#666', fontWeight: '500', marginBottom: '4px', display: 'block'}}>House Number *</label>
                  <input 
                    name="houseNumber" 
                    value={formData.houseNumber} 
                    onChange={handleChange} 
                    placeholder="Apt/House No." 
                    required 
                    style={{width: '100%', padding: '12px'}}
                  />
                </div>
                <div>
                  <label style={{fontSize: '12px', color: '#666', fontWeight: '500', marginBottom: '4px', display: 'block'}}>
                    {locationLoading ? 'Fetching Location...' : 'Current Location'}
                  </label>
                  <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <div 
                      style={{
                        flex: 1, 
                        padding: '12px',
                        background: formData.mapLink ? '#dcfce7' : locationLoading ? '#fef3c7' : '#f3f4f6',
                        border: '1px solid ' + (formData.mapLink ? '#86efac' : locationLoading ? '#fcd34d' : '#e5e7eb'),
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: formData.mapLink ? '#166534' : locationLoading ? '#92400e' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '500'
                      }}
                    >
                      {locationLoading ? (
                        <>
                          <span style={{display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '16px'}}>⏳</span>
                          Getting location...
                        </>
                      ) : formData.mapLink ? (
                        <>
                          <i className="fa-solid fa-check-circle" style={{color: '#22c55e'}}></i>
                          Location Saved
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-location-dot" style={{color: '#9ca3af'}}></i>
                          Click button →
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={locationLoading}
                      style={{
                        padding: '12px 16px',
                        background: formData.mapLink ? '#10b981' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: locationLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: locationLoading ? 0.7 : 1
                      }}
                    >
                      <i className={`fa-solid ${locationLoading ? 'fa-spinner' : formData.mapLink ? 'fa-check' : 'fa-location-crosshairs'}`} 
                         style={{display: 'inline-block', animation: locationLoading ? 'spin 1s linear infinite' : 'none'}}
                      ></i>
                      {locationLoading ? 'Wait...' : formData.mapLink ? 'Saved' : 'Get GPS'}
                    </button>
                  </div>
                </div>
              </div>

              <style jsx>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>

              {locationError && (
                <div style={{color: '#ef4444', fontSize: '12px', marginTop: '5px', width: '100%'}}>
                  ⚠️ {locationError}
                </div>
              )}

              <input name="street" className="full-width" value={formData.street} onChange={handleChange} placeholder={t("Street Address")} required />
              <input name="city" value={formData.city} onChange={handleChange} placeholder={t("City")} required />
              <input name="pincode" value={formData.pincode} onChange={handleChange} placeholder={t("Pincode")} required />

              <button type="submit" className="btn btnbuy" disabled={loading}>
                {loading ? t('Processing...') : t('Buy Now')}
              </button>
            </form>
          </div>

          {/* RIGHT - ORDER SUMMARY */}
          <div className="card checkout-right">
            <h2>{t("Order Summary")}</h2>
            <div>
              {!mounted ? (
                <p style={{textAlign: 'center', color: '#999'}}>{t("Loading cart...")}</p>
              ) : cart.length === 0 ? (
                <p style={{textAlign: 'center', color: '#999'}}>{t("Your cart is empty")}</p>
              ) : (
                cart.map(item => {
                  const itemPrice = parsePrice(typeof item.displayPrice === 'number' ? item.displayPrice : item.price);
                  const itemTotal = itemPrice * item.quantity;
                  const originalPrice = parsePrice(typeof item.displayOriginalPrice === 'number' ? item.displayOriginalPrice : item.originalPrice);
                  const originalTotal = originalPrice > 0 ? originalPrice * item.quantity : 0;
                  const currencyDecimals = selectedCurrency === 'KWD' ? 3 : 2;
                  const itemCurrencySymbol = item.currencySymbol || currencySymbol;
                  
                  return (
                    <div key={item._id || item.id} className="item" style={{marginBottom: '8px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px'}}>
                        <span 
                          style={{
                            flex: 1, 
                            marginRight: '8px', 
                            cursor: 'pointer', 
                            color: '#2563eb',
                            textDecoration: 'none'
                          }}
                          onClick={() => router.push(`/product/${item._id || item.id}`)}
                          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                          {item.name} x {item.quantity}
                        </span>
                        <div style={{textAlign: 'right'}}>
                          <span>{itemTotal.toFixed(currencyDecimals)} {currencySymbol}</span>
                          {originalTotal > itemTotal && (
                            <div style={{fontSize: '10px', color: '#dc2626', textDecoration: 'line-through'}}>
                              {originalTotal.toFixed(currencyDecimals)} {currencySymbol}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="summary">
              {!mounted ? (
                <>
                  <div><span>{t("Subtotal")}:</span><span>{t("Loading...")}</span></div>
                  {discount > 0 && <div><span>{t("Original Price")}:</span><span>{t("Loading...")}</span></div>}
                  {discount > 0 && <div><span>{t("Discount")}:</span><span>{t("Loading...")}</span></div>}
                  <div><span>{t("Shipping")}:</span><span>{t("Loading...")}</span></div>
                  <div className="total"><span>{t("Total")}:</span><span>{t("Loading...")}</span></div>
                </>
              ) : (
                <>
                  {discount > 0 && (
                    <div><span>{t("Original Price")}:</span><span>{originalSubtotal.toFixed(currencySettings?.currency === 'KWD' ? 3 : 2)} {currencySettings?.symbol || 'KWD'}</span></div>
                  )}
                  <div><span>{t("Subtotal")}:</span><span>{subtotal.toFixed(currencySettings?.currency === 'KWD' ? 3 : 2)} {currencySettings?.symbol || 'KWD'}</span></div>
                  {discount > 0 && (
                    <div><span>{t("Discount")}:</span><span style={{color: '#059669'}}>-{discount.toFixed(currencySettings?.currency === 'KWD' ? 3 : 2)} {currencySettings?.symbol || 'KWD'}</span></div>
                  )}
                  <div><span>{t("Shipping")}:</span><span>{shipping.toFixed(currencySettings?.currency === 'KWD' ? 3 : 2)} {currencySettings?.symbol || 'KWD'}</span></div>
                  {appliedCoupon && (
                    <div><span>{t("Coupon Discount")}:</span><span style={{color: '#059669'}}>-{appliedCoupon.discount.toFixed(currencySettings?.currency === 'KWD' ? 3 : 2)} {currencySettings?.symbol || 'KWD'}</span></div>
                  )}
                  <div className="total"><span>{t("Total")}:</span><span>{total.toFixed(currencySettings?.currency === 'KWD' ? 3 : 2)} {currencySettings?.symbol || 'KWD'}</span></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 PAYMENT MODAL / BOTTOM SHEET */}
      {showPaymentModal && (
        <div className="payment-overlay" onClick={() => {
          setShowPaymentModal(false);
          setSelectedPaymentMethod(null);
          setUpiId('');
          setUpiError('');
        }}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            
            <div className="payment-modal-header">
              <h3>{t("Pay via")}</h3>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPaymentMethod(null);
                  setUpiId('');
                  setUpiError('');
                }}
              >✕</button>
            </div>

            <div className="payment-options-container">
              
              {/* UPI Option */}
              <div 
                className={`pay-method-card ${selectedPaymentMethod === 'upi' ? 'selected' : ''}`}
                onClick={() => handlePaymentMethodSelect('upi')}
              >
                <div className="pay-method-title">
                  <span>⚡</span> {t("UPI Payment")}
                </div>
                <div className="upi-apps">
                  <div className="upi-app-icon">
                    <div className="icon-box gpay">GPay</div>
                    <span>Google Pay</span>
                  </div>
                  <div className="upi-app-icon">
                    <div className="icon-box phonepe">पे</div>
                    <span>PhonePe</span>
                  </div>
                  <div className="upi-app-icon">
                    <div className="icon-box paytm">Paytm</div>
                    <span>Paytm</span>
                  </div>
                </div>

                {/* UPI Input Field - Show when UPI is selected */}
                {selectedPaymentMethod === 'upi' && (
                  <div className="upi-input-section" style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0'}}>
                    <input
                      type="text"
                      placeholder="Enter UPI ID (e.g., username@okhdfcbank)"
                      value={upiId}
                      onChange={handleUpiChange}
                      className="upi-input-field"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: upiError ? '2px solid #ef4444' : '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        boxSizing: 'border-box',
                        marginBottom: upiError ? '4px' : '0'
                      }}
                    />
                    {upiError && (
                      <div style={{color: '#ef4444', fontSize: '12px', marginBottom: '10px'}}>
                        {upiError}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => executePayment('upi')}
                      disabled={!upiId || upiError || loading}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: (!upiId || upiError) ? '#cbd5e1' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: (!upiId || upiError) ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginTop: '10px'
                      }}
                    >
                      {loading ? t('Processing...') : t('Pay Now')}
                    </button>
                  </div>
                )}
              </div>

              {/* Credit / Debit Card Option */}
              <div 
                className={`pay-method-card ${selectedPaymentMethod === 'card' ? 'selected' : ''}`}
                onClick={() => handlePaymentMethodSelect('card')}
              >
                <div className="pay-method-title">
                  <span>💳</span> {t("Credit / Debit Card")}
                </div>
                <span style={{fontSize: '12px', color: '#64748b'}}>Visa, MasterCard, RuPay & more</span>
              </div>

               {/* Net Banking Option */}
               <div 
                 className={`pay-method-card ${selectedPaymentMethod === 'netbanking' ? 'selected' : ''}`}
                 onClick={() => handlePaymentMethodSelect('netbanking')}
               >
                <div className="pay-method-title">
                  <span>🏦</span> {t("Net Banking")}
                </div>
                <span style={{fontSize: '12px', color: '#64748b'}}>All major banks available</span>
              </div>

              {/* Cash on Delivery Option */}
              <div 
                className={`pay-method-card ${selectedPaymentMethod === 'cod' ? 'selected' : ''}`}
                onClick={() => {
                  handlePaymentMethodSelect('cod');
                  setTimeout(() => executePayment('cod'), 100);
                }}
              >
                <div className="pay-method-title" style={{marginBottom: '0'}}>
                  <span>💵</span> {t("Cash on Delivery (COD)")}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}



