'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './UserOrderHistory.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const formatCurrency = (value, currencySymbol = '₹') => {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) return `${currencySymbol}0.00`;
  return `${currencySymbol}${numericValue.toFixed(2)}`;
};

const formatDateTime = (value) => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusLabel = (status) => {
  const normalized = String(status || '').toLowerCase();

  switch (normalized) {
    case 'pending':
      return 'Pending';
    case 'confirmed':
      return 'Confirmed';
    case 'processing':
      return 'Processing';
    case 'shipped':
      return 'Shipped';
    case 'out-for-delivery':
      return 'Out for Delivery';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    case 'returned':
      return 'Returned';
    case 'replacement-requested':
      return 'Replacement Requested';
    case 'return-approved':
      return 'Return Approved';
    case 'replacement-approved':
      return 'Replacement Approved';
    case 'refunded':
      return 'Refunded';
    default:
      return 'Pending';
  }
};

const getStatusClass = (status) => {
  const normalized = String(status || '').toLowerCase();

  switch (normalized) {
    case 'delivered':
      return 'status-delivered';
    case 'cancelled':
      return 'status-cancelled';
    case 'returned':
    case 'refunded':
      return 'status-returned';
    case 'confirmed':
      return 'status-confirmed';
    case 'processing':
    case 'shipped':
    case 'out-for-delivery':
      return 'status-processing';
    default:
      return 'status-pending';
  }
};

const getPaymentBadge = (paymentMethod, paymentStatus) => {
  const normalizedMethod = String(paymentMethod || '').toLowerCase();
  const normalizedStatus = String(paymentStatus || '').toLowerCase();

  if (normalizedStatus === 'refunded') {
    return { label: 'Refunded', className: 'payment-refunded' };
  }

  if (normalizedMethod === 'cod') {
    return { label: 'COD', className: 'payment-cod' };
  }

  if (normalizedMethod === 'online' || normalizedStatus === 'paid') {
    return { label: 'Paid', className: 'payment-paid' };
  }

  if (normalizedStatus === 'pending' || normalizedStatus === 'unpaid') {
    return { label: 'Unpaid', className: 'payment-unpaid' };
  }

  return { label: 'Online', className: 'payment-paid' };
};

export default function UserOrderHistory({ user, onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    let isMounted = true;

    const fetchUserOrders = async () => {
      if (!user?._id || !token) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/orders/admin/user/${user._id}/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!isMounted) return;

        const fetchedOrders = Array.isArray(res.data) ? res.data : [];
        setOrders(fetchedOrders);
        const total = fetchedOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
        setTotalSpent(total);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user orders:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserOrders();

    return () => {
      isMounted = false;
    };
  }, [token, user?._id]);

  const summaryLocation = useMemo(() => {
    const address = user?.address || user?.addresses?.[0] || user?.shippingAddress || user?.deliveryAddress;
    if (!address || typeof address !== 'object') return 'Not Available';

    const parts = [
      address.area || address.block || address.street || address.houseNumber || address.apartment || address.floor || address.jadda,
      address.governorate || address.city || address.state,
      address.country
    ].filter(Boolean);

    return parts.join(', ') || 'Not Available';
  }, [user]);

  return (
    <div className="user-order-history-container">
      <div className="order-history-header">
        <button className="back-btn" onClick={onBack}>
          <i className="fa-solid fa-arrow-left" /> Back to Users
        </button>

        <div className="summary-card">
          <div className="summary-card__header">
            <div>
              <p className="summary-eyebrow">Customer Profile</p>
              <h2>{user?.name || 'Customer'}</h2>
              <p className="summary-subtitle">A polished overview of recent purchases and customer details.</p>
            </div>
            <div className="summary-pill-row">
              <span className="summary-pill">Orders {orders.length}</span>
              <span className="summary-pill accent">Spent {formatCurrency(totalSpent, user?.currencySymbol || '₹')}</span>
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-item">
              <span>Email</span>
              <strong>{user?.email || 'Not available'}</strong>
            </div>
            <div className="summary-item">
              <span>Phone</span>
              <strong>{user?.phone || 'Not available'}</strong>
            </div>
            <div className="summary-item">
              <span>Location</span>
              <strong>{summaryLocation}</strong>
            </div>
            <div className="summary-item">
              <span>Member Since</span>
              <strong>{user?.createdAt ? formatDateTime(user.createdAt) : 'Not available'}</strong>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="state-card">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="state-card empty-state-card">
          <div className="empty-state-icon"><i className="fa-solid fa-box-open" /></div>
          <h3>No orders yet</h3>
          <p>This customer has not placed any orders with us yet.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const items = Array.isArray(order.items) ? order.items : [];
            const currencySymbol = order?.currencySymbol || user?.currencySymbol || '₹';
            const orderStatusText = getStatusLabel(order?.orderStatus);
            const orderStatusClass = getStatusClass(order?.orderStatus);
            const paymentBadge = getPaymentBadge(order?.paymentMethod, order?.paymentStatus);
            const subtotalValue = order?.subtotalAmount ?? order?.subtotal ?? order?.subTotal ?? null;
            const shippingValue = order?.shippingAmount ?? order?.shippingCost ?? order?.shippingCharge ?? null;
            const discountValue = order?.coupon?.discount ?? order?.discountAmount ?? order?.discount ?? null;
            const grandTotalValue = order?.totalAmount ?? order?.grandTotal ?? null;

            return (
              <div key={order._id} className="order-card">
                <div className="order-card__header">
                  <div>
                    <p className="order-card__eyebrow">Order Overview</p>
                    <h3>#{order?.orderId || order?._id?.slice(-6)}</h3>
                    <p className="order-date">{formatDateTime(order?.createdAt)}</p>
                  </div>
                  <div className="order-card__badges">
                    <span className={`status-badge ${orderStatusClass}`}>{orderStatusText}</span>
                    <span className={`payment-badge ${paymentBadge.className}`}>{paymentBadge.label}</span>
                  </div>
                </div>

                <div className="order-card__meta">
                  <div className="meta-pill">
                    <span className="meta-label">Payment Method</span>
                    <strong>{String(order?.paymentMethod || 'Not available').toUpperCase()}</strong>
                  </div>
                  <div className="meta-pill">
                    <span className="meta-label">Items</span>
                    <strong>{items.length}</strong>
                  </div>
                  <div className="meta-pill">
                    <span className="meta-label">Ordered On</span>
                    <strong>{formatDateTime(order?.createdAt)}</strong>
                  </div>
                </div>

                <div className="order-items-list">
                  {items.map((item, index) => {
                    const itemSubtotal = Number(item?.price || 0) * Number(item?.quantity || 0);
                    return (
                      <div key={`${order?._id || index}-${item?.productId || index}`} className="order-product-row">
                        <div className="product-media">
                          <img
                            src={item?.image || '/placeholder-product.png'}
                            alt={item?.name || 'Product'}
                            onError={(event) => {
                              event.currentTarget.src = '/placeholder-product.png';
                            }}
                          />
                        </div>
                        <div className="product-details">
                          <div className="product-title-row">
                            <h4>{item?.name || 'Product'}</h4>
                            <span className="quantity-pill">Qty {item?.quantity || 0}</span>
                          </div>
                          <div className="product-meta-row">
                            {item?.selectedColor && <span>Color: {item.selectedColor}</span>}
                            {item?.selectedSize && <span>Size: {item.selectedSize}</span>}
                          </div>
                        </div>
                        <div className="product-price-block">
                          <span className="price-label">Price</span>
                          <strong>{formatCurrency(item?.price, currencySymbol)}</strong>
                        </div>
                        <div className="product-price-block">
                          <span className="price-label">Subtotal</span>
                          <strong>{formatCurrency(itemSubtotal, currencySymbol)}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="order-card__footer">
                  <div className="order-totals">
                    {subtotalValue !== null && subtotalValue !== undefined && (
                      <div className="total-row">
                        <span>Subtotal</span>
                        <strong>{formatCurrency(subtotalValue, currencySymbol)}</strong>
                      </div>
                    )}
                    {shippingValue !== null && shippingValue !== undefined && (
                      <div className="total-row">
                        <span>Shipping</span>
                        <strong>{formatCurrency(shippingValue, currencySymbol)}</strong>
                      </div>
                    )}
                    {discountValue !== null && discountValue !== undefined && (
                      <div className="total-row">
                        <span>Discount</span>
                        <strong>-{formatCurrency(discountValue, currencySymbol)}</strong>
                      </div>
                    )}
                    {grandTotalValue !== null && grandTotalValue !== undefined && (
                      <div className="total-row total-row--grand">
                        <span>Grand Total</span>
                        <strong>{formatCurrency(grandTotalValue, currencySymbol)}</strong>
                      </div>
                    )}
                    {(subtotalValue === null || subtotalValue === undefined) && (grandTotalValue !== null && grandTotalValue !== undefined) && (
                      <div className="total-row total-row--grand">
                        <span>Total</span>
                        <strong>{formatCurrency(grandTotalValue, currencySymbol)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}