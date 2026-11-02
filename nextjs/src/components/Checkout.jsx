'use client';

import React, { useMemo, useState, useEffect, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useProductStore } from '../store/productStore';
import '../components/Checkout.css';
import { useTranslation } from 'react-i18next';
import CheckoutSkeleton from './CheckoutSkeleton';
import CheckoutProgress from './CheckoutProgress';
import CouponForm from './CouponForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production
const subscribeToStorage = (callback) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};
const getCheckoutFormSnapshot = () => (typeof window === 'undefined' ? '' : localStorage.getItem('checkoutFormData') || '');
const getRegisterFormSnapshot = () => (typeof window === 'undefined' ? '' : localStorage.getItem('registerFormData') || '');
const getSelectedAddressSnapshot = () => (typeof window === 'undefined' ? '' : localStorage.getItem('selectedAddressId') || '');
const getServerSnapshot = () => '';
const getServerMountedSnapshot = () => false;
const getClientSnapshot = () => true;
const createAddressId = () => `addr-${Date.now()}`;
const parseStoredObject = (value) => {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

const parsePrice = (price) => {
  const numeric = parseFloat(String(price).replace(/[^0-9.]/g, ''));
  return Number.isNaN(numeric) ? 0 : numeric;
};

const normalizeAddress = (address) => ({
  id: address.id || address._id || '',
  _id: address._id || '',
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
  mapLink: address.mapLink || '',
  isDefault: Boolean(address.isDefault)
});

export default function Checkout() {
  const { user, token, logout, updateProfile } = useAuthStore();
  const { cart, clearCart, appliedCoupon, getDiscountedTotal } = useCartStore();
  const currencySettings = useProductStore((state) => state.currencySettings);
  const selectedCurrency = useProductStore((state) => state.selectedCurrency);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const mounted = useSyncExternalStore(subscribeToStorage, getClientSnapshot, getServerMountedSnapshot);
  const checkoutFormSnapshot = useSyncExternalStore(subscribeToStorage, getCheckoutFormSnapshot, getServerSnapshot);
  const registerFormSnapshot = useSyncExternalStore(subscribeToStorage, getRegisterFormSnapshot, getServerSnapshot);
  const selectedAddressSnapshot = useSyncExternalStore(subscribeToStorage, getSelectedAddressSnapshot, getServerSnapshot);
  const queryAddressId = searchParams.get('addressId') || '';
  const showAddressFormFromQuery = searchParams.get('showAddressForm') === 'true';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user || !token) {
      router.push('/login?redirect=/checkout');
      return;
    }
  }, [user, token, router]);

  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState([]);
  const [paymentMethodsError, setPaymentMethodsError] = useState('');

  const cachedForm = useMemo(() => parseStoredObject(checkoutFormSnapshot), [checkoutFormSnapshot]);
  const savedForm = useMemo(() => parseStoredObject(registerFormSnapshot), [registerFormSnapshot]);
  const savedAddressesFromUser = Array.isArray(user?.addresses) ? user.addresses : [];
  const selectedAddressId = queryAddressId || selectedAddressSnapshot || (() => {
    const defaultAddress = savedAddressesFromUser.find((address) => address.isDefault);
    return defaultAddress?.id || defaultAddress?._id || '';
  })();
  const selectedAddressFromUser = savedAddressesFromUser.find((address) => String(address.id || address._id) === String(selectedAddressId))
    || savedAddressesFromUser.find((address) => address.isDefault);
  const initialForm = useMemo(() => {
    const baseForm = {
      name: user?.name || cachedForm.name || savedForm.name || '',
      phone: user?.phone || cachedForm.phone || savedForm.phone || '',
      addressTitle: user?.address?.addressTitle || cachedForm.addressTitle || savedForm.addressTitle || '',
      governorate: user?.address?.governorate || cachedForm.governorate || savedForm.governorate || '',
      area: user?.address?.area || cachedForm.area || savedForm.area || '',
      block: user?.address?.block || cachedForm.block || savedForm.block || '',
      apartment: user?.address?.apartment || cachedForm.apartment || savedForm.apartment || '',
      floor: user?.address?.floor || cachedForm.floor || savedForm.floor || '',
      jadda: user?.address?.jadda || cachedForm.jadda || savedForm.jadda || '',
      city: user?.address?.city || cachedForm.city || savedForm.city || '',
      state: user?.address?.state || cachedForm.state || savedForm.state || '',
      pincode: user?.address?.pincode || cachedForm.pincode || savedForm.pincode || '',
      street: user?.address?.street || cachedForm.street || savedForm.street || '',
      houseNumber: user?.address?.houseNumber || cachedForm.houseNumber || savedForm.houseNumber || '',
      latitude: user?.address?.latitude || cachedForm.latitude || null,
      longitude: user?.address?.longitude || cachedForm.longitude || null,
      mapLink: user?.address?.mapLink || cachedForm.mapLink || ''
    };
    return selectedAddressFromUser ? { ...baseForm, ...selectedAddressFromUser } : baseForm;
  }, [user, cachedForm, savedForm, selectedAddressFromUser]);
  const [formOverrides, setFormOverrides] = useState(null);
  const formData = formOverrides || initialForm;
  const setFormData = (next) => setFormOverrides((current) => typeof next === 'function' ? next(current || initialForm) : next);
  const [savedAddresses, setSavedAddresses] = useState(savedAddressesFromUser);
  const [selectedSavedAddressIdOverride, setSelectedSavedAddressIdOverride] = useState(null);
  const selectedSavedAddressId = selectedSavedAddressIdOverride ?? selectedAddressId;
  const setSelectedSavedAddressId = setSelectedSavedAddressIdOverride;
  const [addressModalOpen, setAddressModalOpen] = useState(showAddressFormFromQuery);
  const [addressMessage, setAddressMessage] = useState('');
  const [editingAddressId, setEditingAddressId] = useState('');
  const [isAddFormVisible, setIsAddFormVisible] = useState(false); // New state to toggle add address form

  const unavailableItems = cart.filter((item) => parsePrice(typeof item.displayPrice === 'number' ? item.displayPrice : item.price) <= 0).map((item) => item._id || item.id);

  const persistSelectedAddressId = (id) => {
    if (typeof window === 'undefined') return;
    const addressId = String(id || '');
    if (!addressId) return;
    localStorage.setItem('selectedAddressId', addressId);
    setSelectedSavedAddressId(addressId);
  };

  const saveAddressToBackend = async (address) => {
    if (!isAddressSaveable(address)) return null;
    const normalized = normalizeAddress(address);
    const existing = savedAddresses.find((item) =>
      (editingAddressId && String(item.id || item._id) === String(editingAddressId)) ||
      item.name === normalized.name &&
      item.phone === normalized.phone &&
      item.street === normalized.street &&
      item.houseNumber === normalized.houseNumber &&
      item.addressTitle === normalized.addressTitle &&
      item.city === normalized.city &&
      item.pincode === normalized.pincode
    );
    const persistedAddressId = existing?.id || existing?._id || normalized.id || createAddressId();

    const nextAddresses = [
      ...savedAddresses
        .filter((item) => String(item.id || item._id) !== String(persistedAddressId))
        .map((item) => normalized.isDefault ? { ...item, isDefault: false } : item),
      {
        ...normalized,
        id: persistedAddressId,
        _id: existing?._id || normalized._id,
        label: normalized.addressTitle || normalized.name || 'Address'
      }
    ];

    const backendAddresses = nextAddresses.map((address) => {
      const payload = {
        ...address,
        label: address.label || address.addressTitle || address.name || 'Address'
      };
      delete payload.id;
      const backendId = address._id || address.id;
      if (backendId && /^[0-9a-fA-F]{24}$/.test(String(backendId))) {
        payload._id = backendId;
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
      const persistedId = savedAddress?.id || savedAddress?._id || existing?.id || existing?._id || persistedAddressId;
      persistSelectedAddressId(persistedId);
      setEditingAddressId('');
      setAddressMessage(t('Address saved to My Addresses.'));
      return savedAddress || normalized;
    } catch (error) {
      console.error('Failed to save address to backend:', error);
      setAddressMessage(error?.response?.data?.message || error?.message || t('Unable to save this address. Please try again.'));
      return null;
    }
  };

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
    persistSelectedAddressId(address.id || address._id);
    setAddressModalOpen(false);
    setAddressMessage(t('Address selected for checkout.'));
  };

  const handleDeleteSavedAddress = async (id) => {
    const removedAddress = savedAddresses.find((address) => String(address.id || address._id) === String(id));
    const remaining = savedAddresses
      .filter((address) => String(address.id || address._id) !== String(id))
      .map((address, index) => removedAddress?.isDefault && index === 0 ? { ...address, isDefault: true } : address);
    const backendAddresses = remaining.map((address) => {
      const payload = {
        ...address,
        label: address.label || address.addressTitle || address.name || 'Address'
      };
      delete payload.id;
      const backendId = address._id || address.id;
      if (backendId && /^[0-9a-fA-F]{24}$/.test(String(backendId))) {
        payload._id = backendId;
      }
      return payload;
    });
    try {
      const updatedUser = await updateProfile({ addresses: backendAddresses });
      const updatedAddresses = Array.isArray(updatedUser.addresses) ? updatedUser.addresses : remaining;
      setSavedAddresses(updatedAddresses);
      if (String(selectedSavedAddressId) === String(id)) {
        localStorage.removeItem('selectedAddressId');
        setSelectedSavedAddressId('');
      }
      if (String(editingAddressId) === String(id)) {
        setEditingAddressId('');
        setIsAddFormVisible(false);
      }
      setAddressMessage(t('Address deleted successfully.'));
    } catch (error) {
      console.error('Failed to delete saved address:', error);
      setAddressMessage(error?.response?.data?.message || error?.message || t('Unable to delete this address. Please try again.'));
    }
  };

  const handleStartNewAddress = () => {
    setEditingAddressId('');
    setFormData(normalizeAddress({
      name: user?.name || '',
      phone: user?.phone || '',
      addressTitle: selectedCurrency === 'KWD' ? '' : 'Home',
      isDefault: savedAddresses.length === 0
    }));
    setAddressMessage('');
    setIsAddFormVisible(true);
  };

  const handleEditSavedAddress = (address) => {
    setEditingAddressId(String(address.id || address._id));
    setFormData(normalizeAddress(address));
    setAddressMessage('');
    setIsAddFormVisible(true);
  };

  const handleOpenAddressModal = () => {
    setAddressModalOpen(true);
    setAddressMessage('');
    setEditingAddressId('');
    setIsAddFormVisible(false); // Default to hiding form when opening modal
  };

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

  // Fetch enabled payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await axios.get(`${API_URL}/settings/payment-methods`);
        const methods = response.data.enabledPaymentMethods;
        if (!Array.isArray(methods)) {
          setEnabledPaymentMethods([]);
          setPaymentMethodsError(t('Payment options are temporarily unavailable. Please try again later.'));
          return;
        }
        setEnabledPaymentMethods(methods);
        setPaymentMethodsError('');
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        setEnabledPaymentMethods([]);
        setPaymentMethodsError(t('Unable to load payment options. Please try again later.'));
      }
    };

    fetchPaymentMethods();
  }, [t]);

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
    setCheckoutError('');
    
    // Check if any items are unavailable
    if (unavailableItems.length > 0) {
      setCheckoutError(`${unavailableItems.length} product(s) are unavailable. Remove them or change country before continuing.`);
      return;
    }

    const isKuwait = selectedCurrency === 'KWD';

    // Validate common fields
    if (!formData.name || !formData.phone || !formData.street || !formData.houseNumber) {
      setCheckoutError('Please fill in all required address fields.');
      return;
    }

    // Validate country-specific fields
    if (isKuwait) {
      if (!formData.addressTitle || !formData.governorate || !formData.area || !formData.block) {
        setCheckoutError('Please fill in all required address fields.');
        return;
      }
    } else {
      // India validation
      if (!formData.city || !formData.state || !formData.pincode) {
        setCheckoutError('Please fill in all required address fields.');
        return;
      }
    }

    // Validate cart
    if (!cart || cart.length === 0) {
      setCheckoutError('Your bag is empty.');
      return;
    }

    // Validate total
    if (!total || total <= 0) {
      setCheckoutError('Unable to calculate your order total. Please review your bag.');
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

  // Triggered from inside the modal
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
        totalAmount: total.toFixed(currencyDecimals),
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
      if (selectedMethod === 'upi' || selectedMethod === 'wamd') {
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
      if (err.response?.status === 401) {
        logout();
        router.push('/login?redirect=/checkout');
        return;
      }
      alert(err.response?.data?.message || 'Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !token) return null;

  return (
    <>
      {!mounted ? (
        <CheckoutSkeleton />
      ) : (
    <div className="checkout-wrapper">
      <div className="checkout-container">
        <CheckoutProgress active="address" />
        <div className="checkout-header d-flex align-items-center justify-content-between mb-3">
          <h1 className="checkout-title">{t("Delivery Address")}</h1>
          <button type="button" className="btn custom-primary-btn btn-sm d-flex align-items-center gap-1" onClick={handleOpenAddressModal}>
            <i className="fa-solid fa-map-marker-alt"></i>
            {t('My Addresses')}
          </button>
        </div>

        <div className="checkout-grid">

          {/* LEFT - ADDRESS */}
          <div className="card">
            <form className="form" onSubmit={handleOpenPaymentModal}>
              {checkoutError && <p className="payment-config-error full-width" role="alert">{checkoutError}</p>}
              <div className="full-width checkout-delivery-heading">
                <div><span>{t('Delivery To')}</span><h2>{t("Shipping Address")}</h2></div>
                <button type="button" className="checkout-add-address" onClick={handleOpenAddressModal}>＋ {t('Add New Address')}</button>
              </div>

              {savedAddresses.length > 0 && (
                <div className="checkout-saved-addresses full-width">
                  <h3>{t('Saved addresses')}</h3>
                  {savedAddresses.map((address) => {
                    const addressId = String(address.id || address._id);
                    const isSelected = String(selectedSavedAddressId) === addressId;
                    return (
                      <article key={addressId} className={`checkout-saved-address ${isSelected ? 'selected' : ''}`}>
                        <label>
                          <input type="radio" name="savedAddress" checked={isSelected} onChange={() => handleSelectSavedAddress(address)} />
                          <span>
                            <strong>{address.name || t('Delivery address')}</strong>
                            {address.isDefault && <small>{t('Default')}</small>}
                            <span>{address.addressTitle || address.label || t('Address')}</span>
                            <span>{[address.houseNumber, address.street, address.area, address.city, address.state, address.governorate, address.pincode].filter(Boolean).join(', ')}</span>
                            <span>{address.phone}</span>
                          </span>
                        </label>
                        <div>
                          <button type="button" onClick={() => handleEditSavedAddress(address)}>{t('Edit')}</button>
                          <button type="button" onClick={() => handleDeleteSavedAddress(addressId)}>{t('Delete')}</button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
              {!addressModalOpen && addressMessage && (
                <p className="checkout-address-message full-width" role="status">{addressMessage}</p>
              )}

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
                  <select
                    name="addressTitle"
                    value={formData.addressTitle || 'Home'}
                    onChange={handleChange}
                    className="full-width"
                    aria-label={t('Address type')}
                  >
                    <option value="Home">{t('Home')}</option>
                    <option value="Work">{t('Work')}</option>
                  </select>
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

              <button type="submit" className="btnbuy" disabled={loading || unavailableItems.length > 0} style={{opacity: unavailableItems.length > 0 ? 0.6 : 1}}>
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
                <strong><i className="fa-solid fa-triangle-exclamation"></i> {unavailableItems.length} item(s) not available</strong>
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
              <CouponForm subtotal={subtotal} title={t('Have a coupon?')} />
              {!mounted ? (
                <>
                  <div><span>{t("Subtotal")}:</span><span>{t("Loading...")}</span></div>
                  {discount > 0 && <div><span>{t("Discount")}:</span><span>{t("Loading...")}</span></div>}
                  <div><span>{t("Shipping")}:</span><span>{t("Loading...")}</span></div>
                  <div className="total"><span>{t("Total")}:</span><span>{t("Loading...")}</span></div>
                </>
              ) : (
                <>
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
              maxWidth: '550px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '14px',
              background: 'var(--card-bg)',
              padding: '24px',
              boxShadow: '0 24px 80px rgba(15, 23, 42, 0.18)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'}}>
              <div>
                <h2 style={{margin: 0, color: 'var(--text-primary)'}}>{t('My Addresses')}</h2>
                <p style={{margin: '6px 0 0 0', color: 'var(--text-secondary)'}}>{t('Select a saved address or save a new address for future checkout.')}</p>
              </div>
              
              <button
                type="button"
                className="btn custom-primary-btn btn-sm"
                onClick={() => isAddFormVisible ? setIsAddFormVisible(false) : handleStartNewAddress()}
                style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold' }}
              >
                {isAddFormVisible ? t('Close Form') : t('Add Address')}
              </button>
            </div>

            {addressMessage && (
              <div style={{marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', background: '#ecfdf5', color: '#166534'}}>
                {addressMessage}
              </div>
            )}

            {savedAddresses.length > 0 ? (
              <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '24px'}}>
                {savedAddresses.map((address) => (
                  <div
                    key={address.id || address._id}
                    style={{
                      width: '100%',
                      border: String(selectedSavedAddressId) === String(address.id || address._id) ? '1px solid #168c8c' : '1px solid #d1d5db',
                      borderRadius: '12px',
                      padding: '18px',
                      background: String(selectedSavedAddressId) === String(address.id || address._id) ? 'rgba(22, 140, 140, 0.08)' : 'var(--card-bg)'
                    }}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap'}}>
                      <div style={{minWidth: 0}}>
                        <div style={{fontWeight: 700, fontSize: '15px', marginBottom: '6px', color: 'var(--text-primary)'}}>{address.addressTitle || address.name || t('Address')}</div>
                        <div style={{fontSize: '13px', color: 'var(--text-muted, #8b96a5)', lineHeight: 1.6}}>
                          {address.street}{address.houseNumber ? `, ${address.houseNumber}` : ''}{address.apartment ? `, ${address.apartment}` : ''}{address.floor ? `, ${address.floor}` : ''}
                          {address.area ? `, ${address.area}` : ''}{address.city ? `, ${address.city}` : ''}{address.state ? `, ${address.state}` : ''}{address.governorate ? `, ${address.governorate}` : ''}{address.pincode ? `, ${address.pincode}` : ''}
                        </div>
                        <div style={{marginTop: '6px', fontSize: '13px', color: 'var(--text-muted, #8b96a5)'}}><i className="fa-solid fa-phone"></i> {address.phone}</div>
                      </div>
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                        <button
                          type="button"
                          className="btn btn-sm custom-primary-btn"
                          onClick={() => handleSelectSavedAddress(address)}
                        >
                          {t('Use This Address')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm custom-primary-btn"
                          onClick={() => handleEditSavedAddress(address)}
                        >
                          {t('Edit')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm custom-danger-btn"
                          onClick={() => handleDeleteSavedAddress(address.id || address._id)}
                        >
                          {t('Delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{marginBottom: '24px', padding: '18px', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)'}}>
                {t('No saved addresses yet. Click "Add Address" to create one.')}
              </div>
            )}

            {isAddFormVisible && (
              <div style={{borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px'}}>
                  <h3 style={{margin: 0, color: 'var(--text-primary)'}}>{editingAddressId ? t('Edit Address') : t('Add New Address')}</h3>
                  <span style={{fontSize: '13px', color: 'var(--text-muted, #64748b)'}}>{t('Saved to My Addresses automatically')}</span>
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
                      <select
                        name="addressTitle"
                        value={formData.addressTitle || 'Home'}
                        onChange={handleChange}
                        className="form-control"
                      >
                        <option value="Home">{t('Home')}</option>
                        <option value="Work">{t('Work')}</option>
                      </select>
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

                <label className="checkout-default-address">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isDefault)}
                    onChange={(event) => setFormData((previous) => ({ ...previous, isDefault: event.target.checked }))}
                  />
                  {t('Make this my default address')}
                </label>

                <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px'}}>
                  <button type="button" className="btn custom-danger-btn" onClick={() => setAddressModalOpen(false)}>
                    {t('Close')}
                  </button>
                  <button type="button" className="btn custom-primary-btn" onClick={async () => {
                    setAddressMessage('');
                    const saved = await saveAddressToBackend(formData);
                    if (saved) {
                      setAddressMessage(t('Address saved to My Addresses.'));
                      setIsAddFormVisible(false); // Hide the form after saving
                    } else if (!isAddressSaveable(formData)) {
                      setAddressMessage(t('Fill the required address fields before saving.'));
                    }
                  }}>
                    {editingAddressId ? t('Update Address') : t('Save Address')}
                  </button>
                </div>
              </div>
            )}
            
            {/* If Add Form is NOT visible, we still need a way to close the overall modal at the bottom for convenience */}
            {!isAddFormVisible && (
              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '20px'}}>
                <button type="button" className="btn custom-danger-btn" onClick={() => setAddressModalOpen(false)}>
                  {t('Close')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAYMENT MODAL / BOTTOM SHEET */}
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
                {paymentMethodsError && <p className="payment-config-error" role="alert">{paymentMethodsError}</p>}
              
              {/* UPI Option */}
              {enabledPaymentMethods.includes('upi') && (
              <div 
                className={`pay-method-card ${selectedPaymentMethod === 'upi' ? 'selected' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={selectedPaymentMethod === 'upi'}
                onClick={() => { if (selectedPaymentMethod !== 'upi') handlePaymentMethodSelect('upi'); }}
                onKeyDown={(event) => {
                  if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    handlePaymentMethodSelect('upi');
                  }
                }}
              >
                <div className="pay-method-title">
                  <span><i className="fa-solid fa-bolt"></i></span> {t("UPI Payment")}
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
                role="button"
                tabIndex={0}
                aria-pressed={selectedPaymentMethod === 'card'}
                onClick={() => { if (selectedPaymentMethod !== 'card') handlePaymentMethodSelect('card'); }}
                onKeyDown={(event) => {
                  if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    handlePaymentMethodSelect('card');
                  }
                }}
              >
                <div className="pay-method-title">
                  <span><i className="fa-solid fa-credit-card"></i></span> {t("Credit / Debit Card")}
                </div>
                <span style={{fontSize: '12px', color: '#64748b'}}>Visa, MasterCard, RuPay & more</span>
              </div>
              )}

               {/* Net Banking Option */}
               {enabledPaymentMethods.includes('netbanking') && (
               <div 
                 className={`pay-method-card ${selectedPaymentMethod === 'netbanking' ? 'selected' : ''}`}
                 role="button"
                 tabIndex={0}
                 aria-pressed={selectedPaymentMethod === 'netbanking'}
                 onClick={() => { if (selectedPaymentMethod !== 'netbanking') handlePaymentMethodSelect('netbanking'); }}
                 onKeyDown={(event) => {
                   if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                     event.preventDefault();
                     handlePaymentMethodSelect('netbanking');
                   }
                 }}
               >
                <div className="pay-method-title">
                  <span><i className="fa-solid fa-building-columns"></i></span> {t("Net Banking")}
                </div>
                <span style={{fontSize: '12px', color: '#64748b'}}>All major banks available</span>
              </div>
              )}

              {/* WAMD Option (Instant Bank Transfer - Kuwait) */}
              {enabledPaymentMethods.includes('wamd') && (
              <div 
                className={`pay-method-card ${selectedPaymentMethod === 'wamd' ? 'selected' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={selectedPaymentMethod === 'wamd'}
                onClick={() => { if (selectedPaymentMethod !== 'wamd') handlePaymentMethodSelect('wamd'); }}
                onKeyDown={(event) => {
                  if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    handlePaymentMethodSelect('wamd');
                  }
                }}
              >
                <div className="pay-method-title">
                  <span><i className="fa-solid fa-university"></i></span> {t("WAMD - Instant Bank Transfer")}
                </div>
                <span style={{fontSize: '12px', color: '#64748b'}}>Instant bank transfer for Kuwait customers</span>
              </div>
              )}

              {/* Cash on Delivery Option */}
              {enabledPaymentMethods.includes('cod') && (
              <div 
                className={`pay-method-card ${selectedPaymentMethod === 'cod' ? 'selected' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={selectedPaymentMethod === 'cod'}
                onClick={() => {
                  handlePaymentMethodSelect('cod');
                  setTimeout(() => executePayment('cod'), 100);
                }}
                onKeyDown={(event) => {
                  if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    handlePaymentMethodSelect('cod');
                    setTimeout(() => executePayment('cod'), 100);
                  }
                }}
              >
                <div className="pay-method-title" style={{marginBottom: '0'}}>
                  <span><i className="fa-solid fa-money-bill"></i></span> {t("Cash on Delivery (COD)")}
                </div>
              </div>
              )}

              {['card', 'netbanking'].includes(selectedPaymentMethod) && (
                <button
                  type="button"
                  className="payment-continue-button"
                  disabled={loading}
                  onClick={() => executePayment(selectedPaymentMethod)}
                >
                  {loading ? t('Processing...') : t('Continue to Payment')}
                </button>
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