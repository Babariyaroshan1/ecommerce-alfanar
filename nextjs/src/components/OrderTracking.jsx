'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production

export default function OrderTracking({ orderId }) {
  const { token } = useAuthStore();
  const { addToast } = useToastStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order:', error);
      setLoading(false);
    }
  };

  const handleReturnOrder = async () => {
    if (!order || actionLoading) return;
    
    setActionLoading(true);
    try {
      await axios.put(`${API_URL}/orders/${orderId}/status`, {
        orderStatus: 'returned',
        reason: 'Return requested from order tracking page',
        notes: 'Return request submitted by customer from order tracking page.'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast('Return request submitted successfully. Our team will contact you soon.', 'success', 5000);
      fetchOrder(); // Refresh order data
    } catch (error) {
      console.error('Error submitting return request:', error);
      addToast(error.response?.data?.message || 'Failed to submit return request. Please try again.', 'error', 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplaceOrder = async () => {
    if (!order || actionLoading) return;
    
    setActionLoading(true);
    try {
      await axios.put(`${API_URL}/orders/${orderId}/status`, {
        orderStatus: 'replacement-requested',
        reason: 'Replacement requested from order tracking page',
        notes: 'Replacement request submitted by customer from order tracking page.'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast('Replacement request submitted successfully. Our team will contact you soon.', 'success', 5000);
      fetchOrder(); // Refresh order data
    } catch (error) {
      console.error('Error submitting replacement request:', error);
      addToast(error.response?.data?.message || 'Failed to submit replacement request. Please try again.', 'error', 4000);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (!order) return <div className="text-center p-8">Order not found</div>;

  const hasActiveReturnRequest = order.returnRequest?.requestedAt && !['rejected', 'completed'].includes(order.returnRequest.status);
  const hasActiveReplacementRequest = order.replacementRequest?.requestedAt && !['rejected', 'completed'].includes(order.replacementRequest.status);
  
  const normalizedStatus = String(order.orderStatus || '').toLowerCase().trim();
  const canReturn = normalizedStatus === 'delivered' && order.items.some(item => item.allowReturn !== false) && !hasActiveReturnRequest;
  const canReplace = normalizedStatus === 'delivered' && order.items.some(item => item.allowReplacement !== false) && !hasActiveReplacementRequest;

  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered'];
  const currentStatusIndex = statuses.indexOf(order.orderStatus);

  const getStatusMessage = (status) => {
    const messages = {
      pending: 'Order Placed - Waiting for Confirmation',
      confirmed: 'Order Accepted - Preparing for Shipment',
      processing: 'Order Processing - Items are being packed',
      shipped: 'Order Shipped - On the way',
      'out-for-delivery': 'Out for Delivery - Arriving soon',
      delivered: 'Delivered - Enjoy your purchase!',
      cancelled: 'Order Cancelled',
      returned: 'Order Returned',
      refunded: 'Payment Refunded'
    };
    return messages[status] || status;
  };

  return (
    <div className="container mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">Order {order.orderId}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4">Order Status</h3>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="mb-6">
              <h4 className="font-bold mb-2 text-lg">{getStatusMessage(order.orderStatus)}</h4>
              {order.trackingId && order.orderStatus === 'shipped' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>📍 Tracking ID:</strong> {order.trackingId}
                  </p>
                </div>
              )}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentStatusIndex + 1) / statuses.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-4">
              {statuses.map((status, index) => (
                <div key={status} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mr-4 ${
                    index <= currentStatusIndex ? 'bg-green-600' : 'bg-gray-300'
                  }`}>
                    {index < currentStatusIndex ? '✓' : index + 1}
                  </div>
                  <div>
                    <p className="font-bold capitalize">{status}</p>
                    {index <= currentStatusIndex && (
                      <p className="text-gray-600 text-sm">
                        {new Date().toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h3 className="text-xl font-bold mt-8 mb-4">Delivery Address</h3>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="font-bold">{order.shippingAddress.name}</p>
            {order.shippingAddress.houseNumber && <p>House No: {order.shippingAddress.houseNumber}</p>}
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
            <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Order Items</h3>
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            {order.items.map((item) => (
              <div key={item.productId} className="border-b pb-4">
                <div className="flex gap-4">
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <p className="font-bold">{item.name}</p>
                    {(item.selectedColor || item.selectedSize) ? (
                      <p className="text-sm text-gray-500">
                        {item.selectedColor ? `Color: ${item.selectedColor}` : ''}
                        {item.selectedColor && item.selectedSize ? ', ' : ''}
                        {item.selectedSize ? `Size: ${item.selectedSize}` : ''}
                      </p>
                    ) : null}
                    <p className="text-gray-600">{item.price} x {item.quantity}</p>
                    <p className="text-green-600 font-bold">{item.price * item.quantity}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Shipping:</span>
                <span>50</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>{order.totalAmount}</span>
              </div>
              <div className="mt-4 p-3 rounded" style={{
                backgroundColor: order.paymentStatus === 'completed' ? '#d1fae5' : '#fee2e2'
              }}>
                <span style={{
                  color: order.paymentStatus === 'completed' ? '#065f46' : '#991b1b'
                }}>
                  Payment: {order.paymentStatus.toUpperCase()}
                </span>
              </div>
              
              {/* RETURN/REPLACEMENT BUTTONS */}
              {(canReturn || canReplace) && (
                <div className="mt-4 flex gap-3 flex-wrap">
                  {canReturn && (
                    <button 
                      className="px-4 py-2 border border-orange-500 text-orange-500 bg-transparent rounded hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleReturnOrder}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : '↩ Return Order'}
                    </button>
                  )}
                  {canReplace && (
                    <button 
                      className="px-4 py-2 border border-gray-500 text-gray-500 bg-transparent rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleReplaceOrder}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : '🔁 Replace Order'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}