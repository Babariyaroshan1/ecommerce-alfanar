'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useProductStore } from '../store/productStore';
import './OrderDetails.css';
import OrderDetailSkeleton from './OrderDetailSkeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; 

// Format price with proper decimal places (currency-aware)
const formatPrice = (price, currencySymbol = '₹') => {
  if (!price && price !== 0) return '0.00';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '0.00';
  // KWD uses 3 decimals, others use 2
  const decimals = currencySymbol === 'KWD' ? 3 : 2;
  return num.toFixed(decimals);
};

export default function OrderDetails({ orderId }) {
  const router = useRouter();
  const { token } = useAuthStore();
  const selectedCurrency = useProductStore((state) => state.selectedCurrency);
  const [order, setOrder] = useState(null);
  const[loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);  
  const[showRequestForm, setShowRequestForm] = useState(false);
  const [requestType, setRequestType] = useState(null);
  const [requestReason, setRequestReason] = useState('');
  const [requestProofs, setRequestProofs] = useState([]);
  const [requestBankDetails, setRequestBankDetails] = useState({
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    bankName: ''
  });
  const[showTrackingModal, setShowTrackingModal] = useState(false);

  // LOGIC 1: Fetching Order
  useEffect(() => {
    if (!orderId || !token) {
      if (!token) {
        setError('Please log in to view order details');
      }
      setLoading(false);
      return;
    }
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000); 
    return () => clearInterval(interval);
  }, [orderId, token]);

  const fetchOrder = async () => {
    try {
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      const res = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(res.data);
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('Failed to load order. Please try again.');
      setOrder(null);
      setLoading(false);
    }
  };

  const getRefundStatusLabel = () => {
    const requestStatus = order?.returnRequest?.status;
    if (!order) return 'Pending';
    if (order.orderStatus === 'refunded' || requestStatus === 'completed') return 'Refunded';
    if (requestStatus === 'rejected') return 'Rejected';
    if (requestStatus === 'cancelled') return 'Cancelled';
    return 'Pending';
  };

  const getRefundStatusColor = (status) => {
    if (status === 'Refunded') return '#26a541';
    if (status === 'Pending') return '#ff9800';
    if (status === 'Rejected') return '#ff6161';
    if (status === 'Cancelled') return '#6c757d';
    return '#333';
  };

  const refundStatusLabel = getRefundStatusLabel();
  const refundStatusColor = getRefundStatusColor(refundStatusLabel);

  // LOGIC 2: Cancel Order
  const handleCancelOrder = async () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      setActionLoading(true);
      try {
        await axios.put(
          `${API_URL}/orders/${orderId}/status`,
          { orderStatus: 'cancelled', cancelledBy: 'user' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchOrder();
      } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Failed to cancel order');
      }
      setActionLoading(false);
    }
  };

  // LOGIC 3: Return Request Flow
  const handleReturnOrder = () => {
    setRequestType('return');
    setRequestReason('');
    setRequestProofs([]);
    setRequestBankDetails({ accountHolder: '', accountNumber: '', ifsc: '' });
    setShowRequestForm(true);
  };

  // LOGIC 4: Replacement Request Flow
  const handleReplaceOrder = () => {
    setRequestType('replacement');
    setRequestReason('');
    setRequestProofs([]);
    setShowRequestForm(true);
  };

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleProofFiles = async (event) => {
    const files = Array.from(event.target.files ||[]);
    if (files.length === 0) {
      setRequestProofs([]);
      return;
    }

    const images = await Promise.all(files.map(readFileAsDataURL));
    setRequestProofs(images);
  };

  const submitRequest = async () => {
    if (!requestType) return;
    if (!requestReason.trim()) {
      alert('Please enter a reason for your request.');
      return;
    }

    const payload = {
      orderStatus: requestType === 'return' ? 'returned' : 'replacement-requested',
      reason: requestReason,
      proofImages: requestProofs,
      notes: `Customer submitted a ${requestType} request.`
    };

    if (requestType === 'return' && order.paymentMethod === 'cod') {
      if (!requestBankDetails.accountHolder || !requestBankDetails.accountNumber) {
        alert('Please provide bank account holder and account number for COD refund processing.');
        return;
      }
      payload.bankDetails = requestBankDetails;
    }

    setActionLoading(true);
    try {
      await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrder();
      setShowRequestForm(false);
      setRequestType(null);
    } catch (error) {
      console.error('Error submitting request:', error);
      alert(error.response?.data?.message || 'Failed to submit request');
    }
    setActionLoading(false);
  };

  // LOGIC 4b: Cancel Pending Request
  const handleCancelRequest = async (requestTypeToCancel) => {
    if (!window.confirm(`Are you sure you want to cancel this ${requestTypeToCancel} request?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        { cancelRequest: requestTypeToCancel },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrder(); 
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
    setActionLoading(false);
  };

  // LOGIC 5: Reorder
  const handleReorder = () => {
    router.push('/products');
  };

  // LOGIC 6: Download Invoice
  const downloadInvoice = () => {
    if (!order) return;
    const element = document.createElement('a');
    const file = new Blob([generateInvoiceHTML()], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `Invoice-${order.orderId}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateInvoiceHTML = () => {
    if (!order) return '';
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = 5;
    const total = order.totalAmount;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${order.orderId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .invoice { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .section { margin: 20px 0; }
          .section h3 { border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          .summary { float: right; width: 250px; }
          .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .total-row { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <h1>Invoice</h1>
            <p><strong>Order ID:</strong> ${order.orderId}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <h3>Shipping Address</h3>
            <p>${order.shippingAddress.name}<br>
            ${order.shippingAddress.governorate ? `
            ${order.shippingAddress.addressTitle}<br>
            ${order.shippingAddress.block}, ${order.shippingAddress.street}, House No. ${order.shippingAddress.houseNumber}<br>
            ${order.shippingAddress.apartment ? 'Apt: ' + order.shippingAddress.apartment + '<br>' : ''}
            ${order.shippingAddress.floor ? 'Floor: ' + order.shippingAddress.floor + '<br>' : ''}
            ${order.shippingAddress.area}, ${order.shippingAddress.governorate}<br>
            ${order.shippingAddress.jadda ? 'Details: ' + order.shippingAddress.jadda + '<br>' : ''}
            ` : `
            ${order.shippingAddress.houseNumber}, ${order.shippingAddress.street}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}<br>
            `}
            Phone: ${order.shippingAddress.phone}</p>
          </div>

          <div class="section">
            <h3>Order Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Color</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.selectedColor || 'Default'}</td>
                    <td>${item.selectedSize || 'One Size'}</td>
                    <td>${item.quantity}</td>
                    <td>${order.currencySymbol}${formatPrice(item.price, order.currencySymbol)}</td>
                    <td>${order.currencySymbol}${formatPrice(item.price * item.quantity, order.currencySymbol)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>${order.currencySymbol}${formatPrice(subtotal, order.currencySymbol)}</span>
            </div>
            <div class="summary-row">
              <span>Shipping:</span>
              <span>${order.currencySymbol}${formatPrice(shipping, order.currencySymbol)}</span>
            </div>
            <div class="summary-row total-row">
              <span>Total:</span>
              <span>${order.currencySymbol}${formatPrice(total, order.currencySymbol)}</span>
            </div>
            <div class="summary-row">
              <span>Payment Method:</span>
              <span>${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
            </div>
            <div class="summary-row">
              <span>Payment Status:</span>
              <span>${order.paymentStatus || 'pending'}</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  if (loading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="od-container">
        <div className="od-error">
          <h2>❌ {error || 'Order not found'}</h2>
          <button className="od-btn od-btn-outline" onClick={() => window.history.back()}>← Go Back</button>
        </div>
      </div>
    );
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 5;
  const total = order.totalAmount;
  const hasActiveReturnRequest = order.returnRequest?.requestedAt && !['rejected', 'completed'].includes(order.returnRequest.status);
  const hasActiveReplacementRequest = order.replacementRequest?.requestedAt && !['rejected', 'completed'].includes(order.replacementRequest.status);
  const normalizedStatus = String(order.orderStatus || '').toLowerCase().trim();
  const isDelivered = normalizedStatus === 'delivered';
  const canCancel =['pending', 'confirmed', 'processing'].includes(normalizedStatus);
  const canReturn = isDelivered && order.items.some(item => item.allowReturn !== false) && !hasActiveReturnRequest;
  const canReplace = isDelivered && order.items.some(item => item.allowReplacement !== false) && !hasActiveReplacementRequest;
  const canReorder =['delivered', 'cancelled', 'refunded'].includes(normalizedStatus);

  const statusLabels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    'out-for-delivery': 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: order.cancelledBy === 'user' ? 'Cancelled by You' : 'Cancelled by Seller',
    returned: 'Return Requested',
    'replacement-requested': 'Replacement Requested',
    'return-approved': 'Return Approved',
    'return-processing': 'Return Processing',
    'replacement-approved': 'Replacement Approved',
    'replacement-processing': 'Replacement Processing',
    'return-rejected': 'Return Rejected',
    'replacement-rejected': 'Replacement Rejected',
    refunded: 'Refunded'
  };
  const orderStatusLabel = statusLabels[order.orderStatus] || order.orderStatus.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const isCancelledOrReturned =['cancelled', 'returned', 'refunded', 'replacement-requested', 'return-approved', 'return-processing', 'replacement-approved', 'replacement-processing', 'return-rejected', 'replacement-rejected'].includes(order.orderStatus);
  const progressPercentage = ((['confirmed', 'processing', 'shipped', 'delivered'].indexOf(order.orderStatus) + 1) / 4) * 100;

  return (
    <div className="od-wrapper">
      <div className="od-container">
        
        {/* Top Header Card */}
        <div className="od-card od-header">
          <div className="od-header-left">
            <h1>Order Details</h1>
            <p className="od-meta">
              Ordered on {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} 
              <span className="od-divider">|</span> Order# {order.orderId}
            </p>
          </div>
          <div className="od-header-actions">
            <button className="od-btn od-btn-outline" onClick={downloadInvoice} disabled={actionLoading}>
              <i className="fas fa-file-pdf" style={{marginRight: '8px'}}></i>
              Download Invoice
            </button>
          </div>
        </div>

        {/* Status & Timeline Card */}
        <div className="od-card od-status-card">
          <div className="od-status-header">
            <h2>{orderStatusLabel}</h2>
            <p>
              {order.orderStatus === 'cancelled'
                ? order.cancelledBy === 'user'
                  ? 'You have cancelled this order. No refund is due as no payment was collected.'
                  : 'This order has been cancelled by the seller. You will be notified about the next steps.'
                : order.orderStatus === 'replacement-requested' || order.orderStatus === 'replacement-approved' || order.orderStatus === 'replacement-processing'
                ? 'Your replacement request is being processed.'
                : order.orderStatus === 'returned' || order.orderStatus === 'return-approved' || order.orderStatus === 'return-processing'
                ? 'Your return request is being managed by the admin.'
                : `Your package is ${order.orderStatus.replace(/-/g, ' ')}`}
            </p>
          </div>

        {!isCancelledOrReturned && (
            <div className="od-progress-container">
              <div className="od-progress-bar">
                {[
                  { key: 'confirmed', level: 0, label: 'Order Confirmed', icon: '✓', desc: 'Your order has been confirmed' },
                  { key: 'processing', level: 1, label: 'Processing', icon: '📦', desc: 'We are preparing your order' },
                  { key: 'shipped', level: 2, label: 'Shipped', icon: '🚚', desc: 'Your order is on the way' },
                  { key: 'delivered', level: 3, label: 'Delivered', icon: '📍', desc: 'Order delivered successfully' }
                ].map((stage) => {
                  
                  // Status ko numerical level mein map kiya taki "out-for-delivery" pe UI blank na ho
                  const getStatusLevel = (status) => {
                    switch(status) {
                      case 'pending': return 0;
                      case 'confirmed': return 0;
                      case 'processing': return 1;
                      case 'shipped': return 2;
                      case 'out-for-delivery': return 2.5; // Shipped aur Delivered ke beech ka level
                      case 'delivered': return 3;
                      default: return -1;
                    }
                  };

                  const currentLevel = getStatusLevel(order.orderStatus);
                  const isCompleted = currentLevel > stage.level;
                  const isActive = currentLevel === stage.level;
                  const isPending = currentLevel < stage.level;

                  return (
                    <div key={stage.key} className={`od-progress-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}>
                      <div className="od-progress-icon">
                        {isCompleted ? '✓' : isActive ? stage.icon : '○'}
                      </div>
                      <div className="od-progress-content">
                        <div className="od-progress-title">{stage.label}</div>
                        <div className="od-progress-desc">
                          {order.orderStatus === 'out-for-delivery' && stage.key === 'shipped' 
                            ? 'Package is out for delivery today' 
                            : stage.desc}
                        </div>
                        {((isActive || order.orderStatus === 'out-for-delivery') && stage.key === 'shipped') && order.trackingId && (
                          <div className="od-tracking-info">Tracking: {order.trackingId}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div 
                className="od-progress-line"
                style={{ '--progress': `${
                  order.orderStatus === 'pending' ? 0 :
                  order.orderStatus === 'confirmed' ? 0 :
                  order.orderStatus === 'processing' ? 33.33 :
                  order.orderStatus === 'shipped' ? 66.66 :
                  order.orderStatus === 'out-for-delivery' ? 85 : // Line thoda aage badhegi par delivered tak nahi pahuchegi
                  order.orderStatus === 'delivered' ? 100 : 0
                }%` }}
              ></div>
            </div>
          )}
          {isCancelledOrReturned && (
            <div className="od-status-special">
              {order.orderStatus === 'cancelled' && (
                <div className="od-status-cancelled">
                  <span className="od-status-icon">❌</span>
                  <div>
                    <div className="od-status-title">Order Cancelled</div>
                    <div className="od-status-desc">This order has been cancelled</div>
                  </div>
                </div>
              )}
              {(order.orderStatus === 'returned' || order.orderStatus === 'return-approved' || order.orderStatus === 'return-processing') && (
                <div className="od-status-return">
                  <span className="od-status-icon">↩</span>
                  <div>
                    <div className="od-status-title">Return Request</div>
                    <div className="od-status-desc">
                      {order.returnRequest?.status === 'pending' && 'Your return request is being reviewed'}
                      {order.returnRequest?.status === 'approved' && 'Your return request has been approved'}
                      {order.returnRequest?.status === 'processing' && 'Your return is being processed'}
                      {order.returnRequest?.status === 'completed' && 'Return completed successfully'}
                      {order.returnRequest?.status === 'rejected' && 'Return request was rejected'}
                    </div>
                  </div>
                </div>
              )}
              {(order.orderStatus === 'replacement-requested' || order.orderStatus === 'replacement-approved' || order.orderStatus === 'replacement-processing') && (
                <div className="od-status-replacement">
                  <span className="od-status-icon">🔄</span>
                  <div>
                    <div className="od-status-title">Replacement Request</div>
                    <div className="od-status-desc">
                      {order.replacementRequest?.status === 'pending' && 'Your replacement request is being reviewed'}
                      {order.replacementRequest?.status === 'approved' && 'Your replacement request has been approved'}
                      {order.replacementRequest?.status === 'processing' && 'Your replacement is being processed'}
                      {order.replacementRequest?.status === 'completed' && 'Replacement completed successfully'}
                      {order.replacementRequest?.status === 'rejected' && 'Replacement request was rejected'}
                    </div>
                  </div>
                </div>
              )}
              {order.orderStatus === 'refunded' && (
                <div className="od-status-refund">
                  <span className="od-status-icon">💰</span>
                  <div>
                    <div className="od-status-title">Refund Processed</div>
                    <div className="od-status-desc">Your refund has been processed successfully</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Items Card */}
        <div className="od-card od-items-card">
          {order.items.map((item, index) => (
            <div key={index} className="od-item">
              <div className="od-item-img">
                <img src={item.image || '/placeholder.png'} alt={item.name} />
              </div>
              <div className="od-item-info">
                <h3>{item.name}</h3>
                <p className="od-item-variants">
                  {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                  {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                </p>
                <div className="od-item-price-row">
                  <span className="od-item-price">{order.currencySymbol || '₹'}{formatPrice(item.price, order.currencySymbol)}</span>
                  <span className="od-item-qty">Qty: {item.quantity}</span>
                </div>
                <div className="od-item-eligibility">
                  {item.allowReturn !== false ? (
                    <span className="od-eligibility-badge od-return-badge">↩ Return Available</span>
                  ) : (
                    <span className="od-eligibility-badge od-not-available-badge">↩ Return Not Available</span>
                  )}
                  {item.allowReplacement !== false ? (
                    <span className="od-eligibility-badge od-replace-badge">🔁 Replacement Available</span>
                  ) : (
                    <span className="od-eligibility-badge od-not-available-badge">🔁 Replacement Not Available</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Action Buttons for the order */}
          {showRequestForm && (
            <div className="od-card od-request-form" style={{marginTop: '16px'}}>
              <h3>{requestType === 'return' ? 'Submit Return Request' : 'Submit Replacement Request'}</h3>
              <div className="od-form-row">
                <label>Reason for request</label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder={requestType === 'return' ? 'Describe why you want to return this item...' : 'Describe the issue or reason for replacement...'}
                  rows="4"
                  style={{width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px'}}
                />
              </div>
              <div className="od-form-row" style={{marginTop: '12px'}}>
                <label>Proof images (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleProofFiles}
                  style={{display: 'block', marginTop: '4px'}}
                />
                {requestProofs.length > 0 && (
                  <div className="od-proof-preview" style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
                    {requestProofs.map((src, idx) => (
                      <img key={idx} src={src} alt={`proof-${idx}`} style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px'}} />
                    ))}
                  </div>
                )}
              </div>
              {requestType === 'return' && order.paymentMethod === 'cod' && (
                <div className="od-bank-details-grid" style={{marginTop: '12px'}}>
                  <div className="od-form-row" style={{marginBottom: '8px'}}>
                    <label>Bank Name</label>
                    <input
                      type="text"
                      value={requestBankDetails.bankName}
                      onChange={(e) => setRequestBankDetails(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="e.g. State Bank of India"
                      style={{width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px'}}
                    />
                  </div>
                  <div className="od-form-row" style={{marginBottom: '8px'}}>
                    <label>Account Holder</label>
                    <input
                      type="text"
                      value={requestBankDetails.accountHolder}
                      onChange={(e) => setRequestBankDetails(prev => ({ ...prev, accountHolder: e.target.value }))}
                      style={{width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px'}}
                    />
                  </div>
                  <div className="od-form-row" style={{marginBottom: '8px'}}>
                    <label>Account Number</label>
                    <input
                      type="text"
                      value={requestBankDetails.accountNumber}
                      onChange={(e) => setRequestBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                      style={{width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px'}}
                    />
                  </div>
                  <div className="od-form-row" style={{marginBottom: '8px'}}>
                    <label>IFSC Code</label>
                    <input
                      type="text"
                      value={requestBankDetails.ifsc}
                      onChange={(e) => setRequestBankDetails(prev => ({ ...prev, ifsc: e.target.value }))}
                      style={{width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px'}}
                    />
                  </div>
                </div>
              )}
              <div className="od-form-actions" style={{marginTop: '16px', display: 'flex', gap: '12px'}}>
                <button className="od-btn od-btn-primary" onClick={submitRequest} disabled={actionLoading} style={{background: '#007bff', color: 'white'}}>
                  {actionLoading ? 'Submitting...' : 'Send Request'}
                </button>
                <button className="od-btn od-btn-outline" onClick={() => setShowRequestForm(false)} disabled={actionLoading}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="od-order-actions" style={{display: 'flex', flexWrap: 'nowrap', gap: '12px', marginTop: '20px'}}>
             {canCancel && (
              <button className="od-btn od-btn-danger" onClick={handleCancelOrder} disabled={actionLoading}>
                {actionLoading ? 'Cancelling...' : <><i className="fas fa-ban" style={{marginRight: '8px'}}></i>Cancel Order</>}
              </button>
            )}
            {canReturn && (
              <button className="od-btn od-btn-warning" onClick={handleReturnOrder} disabled={actionLoading} style={{border: '1px solid #ff9800', color: '#ff9800', background: 'transparent'}}>
                {actionLoading ? 'Processing...' : <><i className="fas fa-undo" style={{marginRight: '8px'}}></i>Return Order</>}
              </button>
            )}
            {canReplace && (
              <button className="od-btn od-btn-secondary" onClick={handleReplaceOrder} disabled={actionLoading} style={{border: '1px solid #6c757d', color: '#6c757d', background: 'transparent'}}>
                {actionLoading ? 'Processing...' : <><i className="fas fa-sync-alt" style={{marginRight: '8px'}}></i>Replace Order</>}
              </button>
            )}
            {canReorder && (
              <button className="od-btn od-btn-primary" onClick={handleReorder} style={{background: '#000000', color: 'white', border: 'none'}}>
                <i className="fas fa-shopping-cart" style={{marginRight: '8px'}}></i>
                Reorder
              </button>
            )}
            <button className="od-btn od-btn-info" onClick={() => setShowTrackingModal(true)} style={{background: '#000000', color: 'white', border: 'none'}}>
              <i className="fas fa-map-marker-alt" style={{marginRight: '8px'}}></i>
              Track Order
            </button>
          </div>
        </div>

        {/* Return & Refund Info */}
        {(order.returnRequest?.requestedAt || order.replacementRequest?.requestedAt || order.orderStatus === 'refunded') && (
          <div className="od-card od-refund-card">
             <h3>↩ Return & Replacement Details</h3>
             <div className="od-summary-row">
               <span>Order Status:</span>
               <strong style={{color: order.orderStatus === 'returned' ? '#ff6161' : '#3a76f0'}}>{order.orderStatus.toUpperCase()}</strong>
             </div>
             {order.orderStatus === 'returned' && (
               <>
                 <div className="od-summary-row">
                   <span>Refund Status:</span>
                   <strong style={{color: refundStatusColor}}>{refundStatusLabel}</strong>
                 </div>
                 <div className="od-summary-row">
                   <span>Refund Amount:</span>
                   <strong>{order.currencySymbol || '₹'}{formatPrice(total, order.currencySymbol)}</strong>
                 </div>
                 {order.returnRequest?.paymentMethod === 'cod' && order.returnRequest?.bankDetails && (
                   <>
                     <div className="od-summary-row">
                       <span>Bank Name:</span>
                       <strong>{order.returnRequest.bankDetails.bankName || 'N/A'}</strong>
                     </div>
                     <div className="od-summary-row">
                       <span>Refund Method:</span>
                       <strong>Bank Transfer</strong>
                     </div>
                     <div className="od-summary-row">
                       <span>Account No:</span>
                       <strong>{order.returnRequest.bankDetails.accountNumber}</strong>
                     </div>
                     <div className="od-summary-row">
                       <span>Beneficiary:</span>
                       <strong>{order.returnRequest.bankDetails.accountHolder}</strong>
                     </div>
                     <div className="od-summary-row">
                       <span>IFSC:</span>
                       <strong>{order.returnRequest.bankDetails.ifsc}</strong>
                     </div>
                   </>
                 )}
                 {order.returnRequest?.refundDueDate && (
                   <div className="od-summary-row">
                     <span>Expected Refund By:</span>
                     <strong>{new Date(order.returnRequest.refundDueDate).toLocaleDateString()}</strong>
                   </div>
                 )}
                 {(order.returnRequest?.status === 'pending' || order.orderStatus === 'returned') && order.returnRequest?.status !== 'cancelled' && (
                   <div className="od-form-actions" style={{ marginTop: '15px' }}>
                     <button 
                       className="od-btn od-btn-outline" 
                       onClick={() => handleCancelRequest('return')}
                       disabled={actionLoading}
                     >
                       {actionLoading ? 'Cancelling...' : '✕ Cancel Return Request'}
                     </button>
                   </div>
                 )}
               </>
             )}
             {order.orderStatus === 'replacement-requested' && (
               <>
                 <div className="od-summary-row">
                   <span>Replacement Status:</span>
                   <strong style={{color: '#3a76f0'}}>Requested</strong>
                 </div>
                 {(order.replacementRequest?.status === 'pending' || order.orderStatus === 'replacement-requested') && order.replacementRequest?.status !== 'cancelled' && (
                   <div className="od-form-actions" style={{ marginTop: '15px' }}>
                     <button 
                       className="od-btn od-btn-outline" 
                       onClick={() => handleCancelRequest('replacement')}
                       disabled={actionLoading}
                     >
                       {actionLoading ? 'Cancelling...' : '✕ Cancel Replacement Request'}
                     </button>
                   </div>
                 )}
               </>
             )}
          </div>
        )}

        {/* Info Grid (Address & Summary) */}
        <div className="od-info-grid">
          
          {/* Shipping Address */}
          <div className="od-card od-address-card">
            <h3>Shipping Address</h3>
            <strong>{order.shippingAddress.name}</strong>
            
            {order.shippingAddress.governorate ? (
              // KUWAIT ADDRESS FORMAT
              <>
                <p style={{marginTop: '8px', marginBottom: '4px', fontSize: '14px'}}>{order.shippingAddress.addressTitle}</p>
                <p style={{marginBottom: '4px', fontSize: '14px'}}>
                  Block: {order.shippingAddress.block}, Street: {order.shippingAddress.street}
                </p>
                <p style={{marginBottom: '4px', fontSize: '14px'}}>
                  House No.: {order.shippingAddress.houseNumber}
                  {order.shippingAddress.apartment && <>, Apartment: {order.shippingAddress.apartment}</>}
                  {order.shippingAddress.floor && <>, Floor: {order.shippingAddress.floor}</>}
                </p>
                <p style={{marginBottom: '4px', fontSize: '14px'}}>
                  {order.shippingAddress.area}, {order.shippingAddress.governorate}
                </p>
                {order.shippingAddress.jadda && (
                  <p style={{marginBottom: '4px', fontSize: '14px', color: '#666'}}>
                    Details: {order.shippingAddress.jadda}
                  </p>
                )}
              </>
            ) : (
              // INDIA ADDRESS FORMAT
              <>
                <p style={{marginBottom: '4px', fontSize: '14px'}}>
                  {order.shippingAddress.houseNumber}, {order.shippingAddress.street}
                </p>
                <p style={{marginBottom: '4px', fontSize: '14px'}}>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                </p>
              </>
            )}
            
            <p className="od-phone">Phone number: {order.shippingAddress.phone}</p>
          </div>

          {/* Order Summary */}
          <div className="od-card od-summary-card">
            <h3>Order Summary</h3>
            <div className="od-summary-row">
              <span>Item(s) Subtotal:</span>
              <span>{order.currencySymbol || '₹'}{formatPrice(subtotal, order.currencySymbol)}</span>
            </div>
            <div className="od-summary-row">
              <span>Shipping:</span>
              <span>{order.currencySymbol || '₹'}{formatPrice(shipping, order.currencySymbol)}</span>
            </div>
            <div className="od-summary-row od-summary-total">
              <strong>Grand Total:</strong>
              <strong>{order.currencySymbol || '₹'}{formatPrice(total, order.currencySymbol)}</strong>
            </div>
            
            <div className="od-payment-method">
              <strong>Payment Method:</strong>
              <p>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
              <p>Status: <span style={{color: order.paymentStatus === 'paid' ? '#26a541' : '#ff9800'}}>{order.paymentStatus}</span></p>
              {order.paymentId && <p>Txn ID: {order.paymentId}</p>}
            </div>
          </div>

        </div>

      </div>

      {/* Order Tracking Modal (Updated FlipKart/Amazon style) */}
      {showTrackingModal && (
        <div className="od-modal-overlay" onClick={() => setShowTrackingModal(false)}>
          <div className="od-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="od-modal-header">
              <h3>Order Tracking</h3>
              <button className="od-modal-close" onClick={() => setShowTrackingModal(false)}>×</button>
            </div>
            <div className="od-modal-body">
              <div className="od-tracking-status">
                <h4>Status Overview</h4>
                <p className="od-status-message">
                  {order.orderStatus === 'pending' && 'Order Placed - Waiting for seller confirmation.'}
                  {order.orderStatus === 'confirmed' && 'Order Accepted - We are preparing your shipment.'}
                  {order.orderStatus === 'processing' && 'Processing - Your items are being carefully packed.'}
                  {order.orderStatus === 'shipped' && 'Shipped - Package is currently in transit.'}
                  {order.orderStatus === 'out-for-delivery' && 'Out for Delivery - Arriving to your address today.'}
                  {order.orderStatus === 'delivered' && 'Delivered - Successfully handed over. Enjoy your purchase!'}
                  {order.orderStatus === 'cancelled' && 'Order Cancelled - This order will not be fulfilled.'}
                </p>
              </div>

              {/* Minimal Vertical Timeline */}
              <div className="od-tracking-timeline">
                {[
                  { 
                    key: 'pending', 
                    label: 'Order Placed', 
                    desc: 'We have received your order. We are verifying the details and waiting for seller confirmation before proceeding.' 
                  },
                  { 
                    key: 'confirmed', 
                    label: 'Order Confirmed', 
                    desc: 'The seller has successfully verified and accepted your order. Your items will be sorted soon.' 
                  },
                  { 
                    key: 'processing', 
                    label: 'Preparing for Dispatch', 
                    desc: 'Your items are being packed securely and undergoing quality checks at the local warehouse facility.' 
                  },
                  { 
                    key: 'shipped', 
                    label: 'Shipped', 
                    desc: 'Your package has been securely handed over to our courier partner and is in transit to your nearest delivery hub.' 
                  },
                  { 
                    key: 'out-for-delivery', 
                    label: 'Out for Delivery', 
                    desc: 'Our delivery executive is out with your package. Expect delivery by the end of the day. Please keep your OTP ready if applicable.' 
                  },
                  { 
                    key: 'delivered', 
                    label: 'Delivered', 
                    desc: 'Your package was securely handed over to you at the given address. Thank you for shopping with us!' 
                  }
                ].map((step, index) => {
                  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered'];
                  const currentIndex = statuses.indexOf(order.orderStatus);
                  const isCompleted = currentIndex > index;
                  const isActive = currentIndex === index;
                  const isPending = currentIndex < index;

                  return (
                    <div 
                      key={step.key} 
                      className={`od-timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}
                    >
                      <div className="od-timeline-dot"></div>
                      <div className="od-timeline-line"></div>
                      
                      <div className="od-timeline-content">
                        <div className="od-timeline-title">{step.label}</div>
                        {isCompleted && (
                          <div className="od-timeline-date">{new Date(order.updatedAt || order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        )}
                        <div className="od-timeline-desc">{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}