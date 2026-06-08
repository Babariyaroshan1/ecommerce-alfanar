'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const { user, token, updateProfile } = useAuthStore();
  const { cart, clearCart, appliedCoupon, getDiscountedTotal } = useCartStore();
  const currencySettings = useProductStore((state) => state.currencySettings);
  const selectedCurrency = useProductStore((state) => state.selectedCurrency);
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState('');
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressMessage, setAddressMessage] = useState('');

  const persistSelectedAddressId = (id) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('selectedAddressId', id);
    setSelectedSavedAddressId(id);
  };

  const saveAddressToBackend = async (address) => {
    if (!isAddressSaveable(address)) return null;
    const normalized = normalizeAddress(address);
    const existing = savedAddresses.find((item) =>
      item.name === normalized.name &&
      item.phone === normalized.phone &&
      item.street === normalized.street &&
      item.houseNumber === normalized.houseNumber &&
      item.addressTitle === normalized.addressTitle &&
      item.city === normalized.city &&
      item.pincode === normalized.pincode
    );

    const nextAddresses = [
      ...savedAddresses.filter((item) => item.id !== (existing?.id || normalized.id)),
      {
        ...normalized,
        id: existing?.id || normalized.id,
        label: normalized.addressTitle || normalized.name || 'Address'
      }
    ];

    const backendAddresses = nextAddresses.map((address) => {
      const payload = {
        ...address,
        label: address.label || address.addressTitle || address.name || 'Address'
      };
      delete payload.id;
      if (address.id && /^[0-9a-fA-F]{24}$/.test(address.id)) {
        payload._id = address.id;
      }
      return payload;
    });

    try {
      const updatedUser = await updateProfile({ addresses: backendAddresses });
      const updatedAddresses = Array.isArray(updatedUser.addresses) ? updatedUser.addresses : nextAddresses;
      setSavedAddresses(updatedAddresses);
      const savedAddress = updatedAddresses.find((item) =>
        item.name === normalized.name &&
        item.phone === normalized.phone &&
        item.street === normalized.street &&
        item.houseNumber === normalized.houseNumber &&
        item.addressTitle === normalized.addressTitle &&
        item.city === normalized.city &&
        item.pincode === normalized.pincode
      );
      const persistedId = savedAddress?.id || existing?.id || normalized.id;
      persistSelectedAddressId(persistedId);
      setAddressMessage('Address saved to My Addresses.');
      return savedAddress || normalized;
    } catch (error) {
      console.error('Failed to save address to backend:', error);
      return null;
    }
  };

  const normalizeAddress = (address) => ({
    id: address.id || `addr-${Date.now()}`,
    name: address.name || '',
    phone: address.phone || '',
    addressTitle: address.addressTitle || '',
    governorate: address.governorate || '',
    area: address.area || '',
    block: address.block || '',
    apartment: address.apartment || '',
    floor: address.floor || '',
    jadda: address.jadda || '',
    city: address.city || '',
    state: address.state || '',
    pincode: address.pincode || '',
    street: address.street || '',
    houseNumber: address.houseNumber || '',
    latitude: address.latitude || null,
    longitude: address.longitude || null,
    mapLink: address.mapLink || ''
  });

  const isAddressSaveable = (address) => {
    const normalized = normalizeAddress(address);
    if (!normalized.name || !normalized.phone || !normalized.street || !normalized.houseNumber) return false;
    const country = selectedCurrency || 'INR';
    if (country === 'KWD') {
      return !!(normalized.addressTitle && normalized.governorate && normalized.area && normalized.block);
    }
    return !!(normalized.city && normalized.state && normalized.pincode);
  };

  const handleSelectSavedAddress = (address) => {
    setFormData(normalizeAddress(address));
    persistSelectedAddressId(address.id);
    setAddressModalOpen(false);
    setAddressMessage('Address selected for checkout.');
  };

  const handleDeleteSavedAddress = async (id) => {
    const remaining = savedAddresses.filter((address) => address.id !== id);
    const backendAddresses = remaining.map((address) => {
      const payload = {
        ...address,
        label: address.label || address.addressTitle || address.name || 'Address'
      };
      delete payload.id;
      if (address.id && /^[0-9a-fA-F]{24}$/.test(address.id)) {
        payload._id = address.id;
      }
      return payload;
    });
    try {
      const updatedUser = await updateProfile({ addresses: backendAddresses });
      const updatedAddresses = Array.isArray(updatedUser.addresses) ? updatedUser.addresses : remaining;
      setSavedAddresses(updatedAddresses);
      if (selectedSavedAddressId === id) {
        localStorage.removeItem('selectedAddressId');
        setSelectedSavedAddressId('');
      }
    } catch (error) {
      console.error('Failed to delete saved address:', error);
    }
  };

  const handleOpenAddressModal = () => {
    setAddressModalOpen(true);
    setAddressMessage('');
  };

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

    const backendAddresses = Array.isArray(user.addresses) ? user.addresses : [];
    setSavedAddresses(backendAddresses);

    const addressIdFromQuery = searchParams.get('addressId');
    const showAddressForm = searchParams.get('showAddressForm') === 'true';
    const selectedAddressIdFromStorage = localStorage.getItem('selectedAddressId');
    const activeAddressId = addressIdFromQuery || selectedAddressIdFromStorage;
    const selectedAddress = backendAddresses.find((address) => address.id === activeAddressId);

    const initialForm = {
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
    };

    setFormData(selectedAddress ? { ...initialForm, ...selectedAddress } : initialForm);

    if (selectedAddress) {
      persistSelectedAddressId(selectedAddress.id);
    }

    setCheckoutLoading(false);

    if (showAddressForm) {
      setAddressModalOpen(true);
    }
  }, [user, token, searchParams]);

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

  const handleOpenPaymentModal = async (e) => {
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

    // Save this shipping address to saved addresses if possible
    await saveAddressToBackend(formData);

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
        <div className="checkout-header d-flex align-items-center justify-content-between mb-3">
          <h1 className="checkout-title">{t("Checkout")}</h1>
          <button type="button" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={handleOpenAddressModal}>
            <i className="fa-solid fa-map-marker-alt"></i>
            {t('My Addresses')}
          </button>
        </div>

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

      {addressModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setAddressModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '920px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '14px',
              background: '#fff',
              padding: '24px',
              boxShadow: '0 24px 80px rgba(15, 23, 42, 0.18)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
              <div>
                <h2 style={{margin: 0}}>{t('My Addresses')}</h2>
                <p style={{margin: '6px 0 0 0', color: '#475569'}}>{t('Select a saved address or save a new address for future checkout.')}</p>
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setAddressModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {addressMessage && (
              <div style={{marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: '#ecfdf5', color: '#166534'}}>
                {addressMessage}
              </div>
            )}

            {savedAddresses.length > 0 ? (
              <div style={{display: 'grid', gap: '12px', marginBottom: '24px'}}>
                {savedAddresses.map((address) => (
                  <div
                    key={address.id}
                    style={{
                      border: selectedSavedAddressId === address.id ? '1px solid #2563eb' : '1px solid #d1d5db',
                      borderRadius: '12px',
                      padding: '18px',
                      background: selectedSavedAddressId === address.id ? '#eff6ff' : '#ffffff'
                    }}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap'}}>
                      <div style={{minWidth: 0}}>
                        <div style={{fontWeight: 700, fontSize: '15px', marginBottom: '6px'}}>{address.addressTitle || address.name || t('Address')}</div>
                        <div style={{fontSize: '13px', color: '#475569', lineHeight: 1.6}}>
                          {address.street}{address.houseNumber ? `, ${address.houseNumber}` : ''}{address.apartment ? `, ${address.apartment}` : ''}{address.floor ? `, ${address.floor}` : ''}
                          {address.area ? `, ${address.area}` : ''}{address.city ? `, ${address.city}` : ''}{address.state ? `, ${address.state}` : ''}{address.governorate ? `, ${address.governorate}` : ''}{address.pincode ? `, ${address.pincode}` : ''}
                        </div>
                        <div style={{marginTop: '6px', fontSize: '13px', color: '#475569'}}>📞 {address.phone}</div>
                      </div>
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => handleSelectSavedAddress(address)}
                        >
                          {t('Use This Address')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleDeleteSavedAddress(address.id)}
                        >
                          {t('Delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{marginBottom: '24px', padding: '18px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155'}}>
                {t('No saved addresses yet. Add one below and it will appear on My Addresses page.')}
              </div>
            )}

            <div style={{borderTop: '1px solid #e2e8f0', paddingTop: '20px'}}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px'}}>
                <h3 style={{margin: 0}}>{t('Add New Address')}</h3>
                <span style={{fontSize: '13px', color: '#64748b'}}>{t('Saved to My Addresses automatically')}</span>
              </div>

              <div style={{display: 'grid', gap: '12px'}}>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('Full Name')}
                  className="form-control"
                />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t('Phone Number')}
                  className="form-control"
                />

                {selectedCurrency === 'KWD' ? (
                  <>
                    <input
                      name="addressTitle"
                      value={formData.addressTitle}
                      onChange={handleChange}
                      placeholder={t('Address Title (e.g. Home, Work)')}
                      className="form-control"
                    />
                    <select
                      name="governorate"
                      value={formData.governorate}
                      onChange={handleChange}
                      className="form-control"
                    >
                      <option value="">{t('Select Governorate')}</option>
                      <option value="Kuwait">Kuwait</option>
                      <option value="Farwaniya">Farwaniya</option>
                      <option value="Hawalli">Hawalli</option>
                      <option value="Ahmadi">Ahmadi</option>
                      <option value="Jahra">Jahra</option>
                      <option value="Mubarak Al-Kabeer">Mubarak Al-Kabeer</option>
                    </select>
                    <input
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      placeholder={t('Area')}
                      className="form-control"
                    />
                    <div style={{display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr'}}>
                      <input
                        name="block"
                        value={formData.block}
                        onChange={handleChange}
                        placeholder={t('Block')}
                        className="form-control"
                      />
                      <input
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder={t('Street')}
                        className="form-control"
                      />
                    </div>
                    <div style={{display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr 1fr'}}>
                      <input
                        name="houseNumber"
                        value={formData.houseNumber}
                        onChange={handleChange}
                        placeholder={t('House No.')}
                        className="form-control"
                      />
                      <input
                        name="apartment"
                        value={formData.apartment}
                        onChange={handleChange}
                        placeholder={t('Apartment')}
                        className="form-control"
                      />
                      <input
                        name="floor"
                        value={formData.floor}
                        onChange={handleChange}
                        placeholder={t('Floor')}
                        className="form-control"
                      />
                    </div>
                    <input
                      name="jadda"
                      value={formData.jadda}
                      onChange={handleChange}
                      placeholder={t('Jadda (Additional Details)')}
                      className="form-control"
                    />
                  </>
                ) : (
                  <>
                    <input
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      placeholder={t('Street Address')}
                      className="form-control"
                    />
                    <div style={{display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr'}}>
                      <input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder={t('City')}
                        className="form-control"
                      />
                      <input
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder={t('State')}
                        className="form-control"
                      />
                    </div>
                    <div style={{display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr'}}>
                      <input
                        name="houseNumber"
                        value={formData.houseNumber}
                        onChange={handleChange}
                        placeholder={t('House/Building No.')}
                        className="form-control"
                      />
                      <input
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder={t('Pincode')}
                        className="form-control"
                      />
                    </div>
                  </>
                )}
              </div>

              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px'}}>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setAddressModalOpen(false)}>
                  {t('Close')}
                </button>
                <button type="button" className="btn btn-primary" onClick={async () => {
                  const saved = await saveAddressToBackend(formData);
                  if (saved) {
                    setAddressMessage(t('Address saved to My Addresses.'));
                  } else {
                    setAddressMessage(t('Fill the required address fields before saving.'));
                  }
                }}>
                  {t('Save Address')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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



