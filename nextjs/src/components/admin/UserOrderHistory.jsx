'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserOrderHistory.css';
import './UserOrderHistory.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production

export default function UserOrderHistory({ user, onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchUserOrders();
  }, [user._id]);

  const fetchUserOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders/admin/user/${user._id}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
      const total = res.data.reduce((sum, order) => sum + order.totalAmount, 0);
      setTotalSpent(total);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'out-for-delivery': return 'status-out-for-delivery';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      case 'returned': return 'status-returned';
      case 'refunded': return 'status-refunded';
      default: return 'status-default';
    }
  };

  return (
    <div className="user-order-history-container">
      <div className="order-history-header">
        <button className="back-btn" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Back to Users
        </button>
        <div className="user-summary">
          <h2>{user.name}'s Order History</h2>
          <div className="user-details">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
            <p><strong>Total Orders:</strong> {orders.length}</p>
            <p><strong>Total Spent:</strong> ₹{totalSpent.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="no-orders">No orders found for this user</div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.orderId}</h3>
                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="order-status">
                  <span className={`status-badge ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-image">
                      <img
                        src={item.image || '/placeholder-product.png'}
                        alt={item.name}
                        onError={(e) => {
                          e.target.src = '/placeholder-product.png';
                        }}
                      />
                    </div>
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <div className="item-variations">
                        {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                        {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                      </div>
                      <div className="item-quantity-price">
                        <span>Qty: {item.quantity}</span>
                        <span>₹{item.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <strong>Total: ₹{order.totalAmount.toFixed(2)}</strong>
                </div>
                <div className="order-payment">
                  <span>Payment: {order.paymentMethod.toUpperCase()}</span>
                  <span className={`payment-status ${order.paymentStatus === 'paid' ? 'paid' : 'pending'}`}>
                    {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                {order.trackingId && (
                  <div className="tracking-info">
                    <span>Tracking ID: {order.trackingId}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}