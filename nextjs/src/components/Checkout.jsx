'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useProductStore } from '../store/productStore';
import '../components/Checkout.css';
import { useTranslation } from 'react-i18next';
import CheckoutSkeleton from './CheckoutSkeleton';

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
  const [checkoutLoading, setCheckoutLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState([]);

  // Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState(['upi', 'card', 'netbanking', 'cod']);

  const[formData, setFormData] = useState({
    name: '',
    phone: '',
    // Kuwait fields
    addressTitle: '',
    governorate: '',
    area: '',
    block: '',
    apartment: '',
    floor: '',
    jadda: '',
    // India fields
    city: '',
    state: '',
    pincode: '',
    // Common fields
    street: '',
    houseNumber: '',
    latitude: null,
    longitude: null,
    mapLink: ''
  });

  useEffect(() => {
    setMounted(true);

    // Load from checkout form cache first, then user profile, then registerFormData
    const checkoutCache = localStorage.getItem('checkoutFormData');
    const savedRegisterData = localStorage.getItem('registerFormData');
    let cachedForm = {};
    let savedForm = {};

    try {
      cachedForm = checkoutCache ? JSON.parse(checkoutCache) : {};
      savedForm = savedRegisterData ? JSON.parse(savedRegisterData) : {};
    } catch {
      cachedForm = {};
      savedForm = {};
    }

    setFormData({
      name: user?.name || cachedForm.name || savedForm.name || '',
      phone: user?.phone || cachedForm.phone || savedForm.phone || '',
      // Kuwait fields
      addressTitle: user?.address?.addressTitle || cachedForm.addressTitle || savedForm.addressTitle || '',
      governorate: user?.address?.governorate || cachedForm.governorate || savedForm.governorate || '',
      area: user?.address?.area || cachedForm.area || savedForm.area || '',
      block: user?.address?.block || cachedForm.block || savedForm.block || '',
      apartment: user?.address?.apartment || cachedForm.apartment || savedForm.apartment || '',
      floor: user?.address?.floor || cachedForm.floor || savedForm.floor || '',
      jadda: user?.address?.jadda || cachedForm.jadda || savedForm.jadda || '',
      // India fields
      city: user?.address?.city || cachedForm.city || savedForm.city || '',
      state: user?.address?.state || cachedForm.state || savedForm.state || '',
      pincode: user?.address?.pincode || cachedForm.pincode || savedForm.pincode || '',
      // Common fields
      street: user?.address?.street || cachedForm.street || savedForm.street || '',
      houseNumber: user?.address?.houseNumber || cachedForm.houseNumber || savedForm.houseNumber || '',
      latitude: user?.address?.latitude || cachedForm.latitude || null,
      longitude: user?.address?.longitude || cachedForm.longitude || null,
      mapLink: user?.address?.mapLink || cachedForm.mapLink || ''
    });

    setCheckoutLoading(false);

  }, [user, token]);

  // Auto-save form data to localStorage whenever it changes
  useEffect(() => {
    if (mounted && formData.name) {
      try {
        localStorage.setItem('checkoutFormData', JSON.stringify(formData));
      } catch (err) {
        console.error('Error saving checkout form to localStorage:', err);
      }
    }
  }, [formData, mounted]);

  // Validate cart items when currency changes
  useEffect(() => {
    validateCartItems();
  }, [selectedCurrency, cart]);

  // Fetch enabled payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await axios.get(`${API_URL}/settings/payment-methods`);
        setEnabledPaymentMethods(response.data.enabledPaymentMethods || ['upi', 'card', 'netbanking', 'cod']);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        // Default to all methods if fetch fails
        setEnabledPaymentMethods(['upi', 'card', 'netbanking', 'cod']);
      }
    };

    fetchPaymentMethods();
  }, []);

  const validateCartItems = async () => {
    try {
      const unavailable = [];
      
      for (const item of cart) {
        // Check if item has displayPrice in the selected currency
        const itemPrice = parsePrice(typeof item.displayPrice === 'number' ? item.displayPrice : item.price);
        
        // If no price, try to fetch product details to check multi-currency prices
        if (!itemPrice || itemPrice <= 0) {
          unavailable.push(item._id || item.id);
        }
      }
      
      setUnavailableItems(unavailable);
    } catch (err) {
      console.error('Error validating cart items:', err);
    }
  };

  const currencyDecimals = selectedCurrency === 'KWD' ? 3 : 2;
  const currencySymbol = selectedCurrency === 'INR' ? '₹' : selectedCurrency === 'KWD' ? 'KWD' : currencySettings?.symbol || '₹';
  
  // Calculate subtotal excluding unavailable items
  const subtotal = cart.reduce((sum, item) => {
    if (unavailableItems.includes(item._id || item.id)) return sum;
    return sum + parsePrice(typeof item.displayPrice === 'number' ? item.displayPrice : item.price) * item.quantity;
  }, 0);
  
  const originalSubtotal = cart.reduce((sum, item) => {
    if (unavailableItems.includes(item._id || item.id)) return sum;
    const unit = parsePrice(typeof item.displayOriginalPrice === 'number' ? item.displayOriginalPrice : item.originalPrice);
    return sum + (unit > 0 ? unit * item.quantity : 0);
  }, 0);
  
  const discount = Math.max(0, originalSubtotal - subtotal);
  
  // Calculate shipping only if there are available items
  const availableItemsCount = cart.length - unavailableItems.length;
  const shipping = availableItemsCount > 0 ? (selectedCurrency === 'INR' ? (currencySettings?.shippingPriceINR ?? 0) : (currencySettings?.shippingPriceKWD ?? currencySettings?.shippingPrice ?? 5)) : 0;
  const discountedSubtotal = getDiscountedTotal();
  const total = discountedSubtotal + shipping;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    
    // Check if any items are unavailable
    if (unavailableItems.length > 0) {
      alert(`${unavailableItems.length} product(s) not available in selected country. Please remove unavailable items or change country.`);
      return;
    }

    const isKuwait = selectedCurrency === 'KWD';

    // Validate common fields
    if (!formData.name || !formData.phone || !formData.street || !formData.houseNumber) {
      alert('Please fill in all required address fields');
      return;
    }

    // Validate country-specific fields
    if (isKuwait) {
      if (!formData.addressTitle || !formData.governorate || !formData.area || !formData.block) {
        alert('Please fill in all required address fields');
        return;
      }
    } else {
      // India validation
      if (!formData.city || !formData.state || !formData.pincode) {
        alert('Please fill in all required address fields');
        return;
      }
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

    // Fetch geolocation automatically
    fetchGeolocationAndProceed();
  };

  // Fetch geolocation and proceed to payment modal
  const fetchGeolocationAndProceed = async () => {
    setLoading(true);

    if (!navigator.geolocation) {
      console.warn('Geolocation not supported, proceeding without location data');
      setLoading(false);
      setShowPaymentModal(true);
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
        
        setLoading(false);
        setShowPaymentModal(true);
      },
      (error) => {
        // If geolocation fails, proceed anyway without location data
        console.warn('Geolocation failed:', error.message);
        setLoading(false);
        setShowPaymentModal(true);
      },
      { timeout: 10000 }
    );
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
        localStorage.removeItem('checkoutFormData');
        router.push(`/order/${orderId}`);
        return;
      }

      // For UPI: Show success message and redirect
      if (selectedMethod === 'upi') {
        clearCart();
        setUpiId('');
        localStorage.removeItem('checkoutFormData');
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
          localStorage.removeItem('checkoutFormData');
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
    <>
      {checkoutLoading ? (
        <CheckoutSkeleton />
      ) : (
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
              
              {selectedCurrency === 'KWD' ? (
                // KUWAIT ADDRESS FORM
                <>
                  <input 
                    name="addressTitle" 
                    className="full-width" 
                    value={formData.addressTitle} 
                    onChange={handleChange} 
                    placeholder={t("Address Title (e.g., Home, Work)")} 
                    required 
                  />

                  <select 
                    name="governorate" 
                    value={formData.governorate} 
                    onChange={handleChange} 
                    className="full-width"
                    required
                    style={{padding: '12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px'}}
                  >
                    <option value="">{t("Select Governorate *")}</option>
                    <option value="Kuwait">Kuwait</option>
                    <option value="Farwaniya">Farwaniya</option>
                    <option value="Hawalli">Hawalli</option>
                    <option value="Ahmadi">Ahmadi</option>
                    <option value="Jahra">Jahra</option>
                    <option value="Mubarak Al-Kabeer">Mubarak Al-Kabeer</option>
                  </select>

                  <input 
                    name="area" 
                    className="full-width" 
                    value={formData.area} 
                    onChange={handleChange} 
                    placeholder={t("Area")} 
                    required 
                  />

                  {/* Grid layout for Address Details */}
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%'}}>
                    <input 
                      name="block" 
                      value={formData.block} 
                      onChange={handleChange} 
                      placeholder={t("Block *")} 
                      required 
                      style={{width: '100%', padding: '12px'}}
                    />
                    <input 
                      name="street" 
                      value={formData.street} 
                      onChange={handleChange} 
                      placeholder={t("Street *")} 
                      required 
                      style={{width: '100%', padding: '12px'}}
                    />
                  </div>

                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', width: '100%'}}>
                    <input 
                      name="houseNumber" 
                      value={formData.houseNumber} 
                      onChange={handleChange} 
                      placeholder={t("House No. *")} 
                      required 
                      style={{width: '100%', padding: '12px'}}
                    />
                    <input 
                      name="apartment" 
                      value={formData.apartment} 
                      onChange={handleChange} 
                      placeholder={t("Apartment")} 
                      style={{width: '100%', padding: '12px'}}
                    />
                    <input 
                      name="floor" 
                      value={formData.floor} 
                      onChange={handleChange} 
                      placeholder={t("Floor")} 
                      style={{width: '100%', padding: '12px'}}
                    />
                  </div>

                  <input 
                    name="jadda" 
                    className="full-width" 
                    value={formData.jadda} 
                    onChange={handleChange} 
                    placeholder={t("Jadda (Additional Details)")} 
                    style={{padding: '12px'}}
                  />
                </>
              ) : (
                // INDIA ADDRESS FORM
                <>
                  <input 
                    name="street" 
                    className="full-width" 
                    value={formData.street} 
                    onChange={handleChange} 
                    placeholder={t("Street Address *")} 
                    required 
                  />

                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%'}}>
                    <input 
                      name="city" 
                      value={formData.city} 
                      onChange={handleChange} 
                      placeholder={t("City *")} 
                      required 
                      style={{width: '100%', padding: '12px'}}
                    />
                    <input 
                      name="state" 
                      value={formData.state} 
                      onChange={handleChange} 
                      placeholder={t("State *")} 
                      required 
                      style={{width: '100%', padding: '12px'}}
                    />
                  </div>

                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%'}}>
                    <input 
                      name="houseNumber" 
                      value={formData.houseNumber} 
                      onChange={handleChange} 
                      placeholder={t("House/Building No. *")} 
                      required 
                      style={{width: '100%', padding: '12px'}}
                    />
                    <input 
                      name="pincode" 
                      value={formData.pincode} 
                      onChange={handleChange} 
                      placeholder={t("Pincode *")} 
                      required 
                      style={{width: '100%', padding: '12px'}}
                    />
                  </div>
                </>
              )}

              <button type="submit" className="btn btnbuy" disabled={loading || unavailableItems.length > 0} style={{opacity: unavailableItems.length > 0 ? 0.6 : 1}}>
                {unavailableItems.length > 0 ? t('Remove Unavailable Items') : loading ? t('Fetching Location & Processing...') : t('Buy Now')}
              </button>
            </form>
          </div>

          {/* RIGHT - ORDER SUMMARY */}
          <div className="card checkout-right">
            <h2>{t("Order Summary")}</h2>
            
            {unavailableItems.length > 0 && (
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#92400e'
              }}>
                <strong>⚠️ {unavailableItems.length} item(s) not available</strong>
                <p style={{margin: '6px 0 0 0', fontSize: '12px'}}>
                  These products are not available in {selectedCurrency === 'KWD' ? 'Kuwait' : 'India'}. Please remove them or change country to continue.
                </p>
              </div>
            )}
            
            <div>
              {!mounted ? (
                <p style={{textAlign: 'center', color: '#999'}}>{t("Loading cart...")}</p>
              ) : cart.length === 0 ? (
                <p style={{textAlign: 'center', color: '#999'}}>{t("Your cart is empty")}</p>
              ) : (
                cart.map(item => {
                  const itemId = item._id || item.id;
                  const isUnavailable = unavailableItems.includes(itemId);
                  const itemPrice = parsePrice(typeof item.displayPrice === 'number' ? item.displayPrice : item.price);
                  const itemTotal = itemPrice * item.quantity;
                  const originalPrice = parsePrice(typeof item.displayOriginalPrice === 'number' ? item.displayOriginalPrice : item.originalPrice);
                  const originalTotal = originalPrice > 0 ? originalPrice * item.quantity : 0;
                  const currencyDecimals = selectedCurrency === 'KWD' ? 3 : 2;
                  const itemCurrencySymbol = item.currencySymbol || currencySymbol;
                  const countryName = selectedCurrency === 'KWD' ? 'Kuwait' : 'India';
                  
                  return (
                    <div key={itemId} className="item" style={{marginBottom: '8px', opacity: isUnavailable ? 0.6 : 1}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px'}}>
                        <span 
                          style={{
                            flex: 1, 
                            marginRight: '8px', 
                            cursor: 'pointer', 
                            color: isUnavailable ? '#999' : '#2563eb',
                            textDecoration: 'none',
                            textDecorationLine: isUnavailable ? 'line-through' : 'none'
                          }}
                          onClick={() => !isUnavailable && router.push(`/product/${itemId}`)}
                        >
                          {item.name} x {item.quantity}
                        </span>
                        <div style={{textAlign: 'right'}}>
                          {isUnavailable ? (
                            <div style={{fontSize: '11px', color: '#ef4444', fontWeight: 'bold'}}>
                              Not available in {countryName}
                            </div>
                          ) : (
                            <>
                              <span>{itemTotal.toFixed(currencyDecimals)} {currencySymbol}</span>
                              {originalTotal > itemTotal && (
                                <div style={{fontSize: '10px', color: '#dc2626', textDecoration: 'line-through'}}>
                                  {originalTotal.toFixed(currencyDecimals)} {currencySymbol}
                                </div>
                              )}
                            </>
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
              {enabledPaymentMethods.includes('upi') && (
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
              )}

              {/* Credit / Debit Card Option */}
              {enabledPaymentMethods.includes('card') && (
              <div 
                className={`pay-method-card ${selectedPaymentMethod === 'card' ? 'selected' : ''}`}
                onClick={() => handlePaymentMethodSelect('card')}
              >
                <div className="pay-method-title">
                  <span>💳</span> {t("Credit / Debit Card")}
                </div>
                <span style={{fontSize: '12px', color: '#64748b'}}>Visa, MasterCard, RuPay & more</span>
              </div>
              )}

               {/* Net Banking Option */}
               {enabledPaymentMethods.includes('netbanking') && (
               <div 
                 className={`pay-method-card ${selectedPaymentMethod === 'netbanking' ? 'selected' : ''}`}
                 onClick={() => handlePaymentMethodSelect('netbanking')}
               >
                <div className="pay-method-title">
                  <span>🏦</span> {t("Net Banking")}
                </div>
                <span style={{fontSize: '12px', color: '#64748b'}}>All major banks available</span>
              </div>
              )}

              {/* Cash on Delivery Option */}
              {enabledPaymentMethods.includes('cod') && (
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
              )}

            </div>

          </div>
        </div>
      )}
      
      </div>
      )}
    </>
  );
}



