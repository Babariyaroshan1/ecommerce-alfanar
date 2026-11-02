'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import AccountSidebar, { useAccountHydrated } from './AccountSidebar';
import './Orders.css';
import OrderListSkeleton from './OrderListSkeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production

// Format price with proper decimal places (currency-aware)
const formatPrice = (price, currencySymbol = '₹') => {
  if (!price && price !== 0) return '0.00';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '0.00';
  // KWD uses 3 decimals, others use 2
  const decimals = currencySymbol === 'KWD' ? 3 : 2;
  return num.toFixed(decimals);
};

export default function Orders() {
  const { user } = useAuthStore();
  const hydrated = useAccountHydrated();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      setOrders(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.push('/login?redirect=/orders');
      return;
    }

    void Promise.resolve().then(fetchOrders);
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders, hydrated, user, router]);

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending': return 'Waiting for Confirmation';
      case 'confirmed': return 'Your order has been confirmed';
      case 'processing': return 'We are preparing your order';
      case 'shipped': return 'Your order is successfully shipped';
      case 'out-for-delivery': return 'Out for delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
              
      default: return status;
    }
  };

  if (!hydrated || !user) return null;

  return (
    <main className="orders-wrapper account-page">
      <div className="account-page-layout">
        <AccountSidebar active="orders" />
        <section className="orders-main">
          <div className="orders-header">
            <h1>My Orders</h1>
            <p className="subtitle">Check the status of your recent purchases</p>
          </div>

          {loading ? <OrderListSkeleton /> : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><i className="fa-solid fa-box"></i></div>
              <h2>No orders yet</h2>
              <p>Looks like you haven&apos;t made any purchases yet.</p>
              <button className="continue-btn" onClick={() => router.push('/')}>
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

                return (
                  <div key={order._id} className="order-card">
                    <div className="order-card-header">
                      <div className="order-info-top">
                        <span className="order-id">Order #{order.orderId}</span>
                        <span className="order-date">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className={`status-badge ${order.orderStatus}`}>
                        {getStatusMessage(order.orderStatus)}
                      </div>
                    </div>

                    <div className="order-card-footer">
                      <div className="order-total-info">
                        <span className="total-label">Total Amount ({totalItems} Items):</span>
                        <span className="total-price" style={{whiteSpace: 'nowrap'}}>{order.currencySymbol || '₹'}{formatPrice(order.totalAmount, order.currencySymbol)}</span>
                      </div>
                      <button
                        className="view-details-btn"
                        onClick={() => router.push(`/order/${order._id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}