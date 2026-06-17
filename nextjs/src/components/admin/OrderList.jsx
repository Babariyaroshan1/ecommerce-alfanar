'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './OrderList.css';

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

const hasValidRequest = (order) => {
  return (order.returnRequest?.requestedAt) || (order.replacementRequest?.requestedAt);
};

export default function OrderList({ showOnlyRequests = false }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // Refersh state
  const [autoAccept, setAutoAccept] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [trackingModal, setTrackingModal] = useState({ orderId: null, trackingId: '' });
  const [requestFilter, setRequestFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestImages, setShowRequestImages] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (manualRefresh = false) => {
    if (manualRefresh) setIsRefreshing(true);
    try {
      const res = await axios.get(`${API_URL}/orders/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
      setLastUpdate(new Date());

      // Auto accept pending orders if enabled
      if (autoAccept) {
        const pendingOrders = res.data.filter(order => order.orderStatus === 'pending');
        for (const order of pendingOrders) {
          await updateOrderStatus(order._id, 'confirmed');
        }
        if (pendingOrders.length > 0) {
          fetchOrders();
        }
      }

      setLoading(false);
      if (manualRefresh) setIsRefreshing(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
      if (manualRefresh) setIsRefreshing(false);
    }
  };

  const updateOrderStatus = async (orderId, status, additionalData = {}) => {
    try {
      const payload = { ...additionalData };
      if (status !== undefined) {
        payload.orderStatus = status;
      }
      console.log('Sending payload:', JSON.stringify(payload));
      const response = await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Success response:', response.data);
      alert('Request updated successfully!');
      fetchOrders(true); // Auto refresh with loader after action
      setSelectedRequest(null); // Close modal
    } catch (error) {
      console.error('Error updating order:', error);
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Error: ${errorMsg}`);
    }
  };

  const handleRefresh = () => {
    if (isRefreshing) return;
    fetchOrders(true);
  };

  const acceptOrder = (orderId) => updateOrderStatus(orderId, 'confirmed');
  const cancelOrder = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      updateOrderStatus(orderId, 'cancelled', { cancelledBy: 'admin' });
    }
  };

  const shouldShowRefundButton = (order) => {
    if (order.orderStatus === 'refunded') return false;
    if (order.returnRequest?.status || order.replacementRequest?.status) {
      if (order.paymentMethod === 'cod') {
        return order.paymentStatus === 'paid' && ['approved', 'processing'].includes(order.returnRequest?.status);
      }
      return order.returnRequest?.status && ['approved', 'processing'].includes(order.returnRequest?.status);
    }
    if (order.orderStatus === 'cancelled') {
      if (order.paymentMethod === 'cod') return false;
      return order.paymentStatus === 'paid';
    }
    return false;
  };

  const moveToProcessing = (orderId) => updateOrderStatus(orderId, 'processing');
  const handleShipOrder = (orderId) => updateOrderStatus(orderId, 'shipped');
  const markOutForDelivery = (orderId) => updateOrderStatus(orderId, 'out-for-delivery');
  const markDelivered = (orderId) => updateOrderStatus(orderId, 'delivered');
  const markReturned = (orderId) => {
    if (window.confirm('Mark this order as returned?')) updateOrderStatus(orderId, 'returned');
  };
  const markReplaced = (orderId) => {
    if (window.confirm('Mark this order as replacement-requested?')) updateOrderStatus(orderId, 'replacement-requested');
  };

  const markRefunded = (order) => {
    if (order.orderStatus === 'cancelled' && order.paymentMethod === 'cod') {
      alert('No refund needed for cancelled COD orders. Payment was not taken.');
      return;
    }
    const requestType = order.returnRequest?.status ? 'return' : null;
    if (!requestType || !['pending', 'approved', 'processing'].includes(order.returnRequest?.status)) {
      alert('Refund can only be processed through the return request workflow. Use the request panel.');
      return;
    }

    if (order.paymentMethod === 'cod') {
      const accountHolder = prompt('Enter bank account holder name:');
      const accountNumber = prompt('Enter bank account number:');
      const ifsc = prompt('Enter IFSC code:');
      if (!accountHolder || !accountNumber || !ifsc) {
        alert('Bank details are required to complete a COD refund.');
        return;
      }
      updateOrderStatus(order._id, undefined, {
        requestType: 'return',
        requestAction: 'complete',
        bankDetails: { accountHolder, accountNumber, ifsc },
        notes: 'COD refund completed by admin.'
      });
    } else {
      if (!window.confirm('Approve the return request and refund online payment?')) return;
      updateOrderStatus(order._id, undefined, {
        requestType: 'return',
        requestAction: 'approve',
        notes: 'Online return approved and refund processed automatically.'
      });
    }
  };

  const getRequestType = (order) => {
    if (order.returnRequest?.requestedAt) return 'Return';
    if (order.replacementRequest?.requestedAt) return 'Replacement';
    return 'Request';
  };

  const getRequestStatus = (order) => {
    if (order.returnRequest?.requestedAt) {
      return order.returnRequest.status || 'pending';
    }
    if (order.replacementRequest?.requestedAt) {
      return order.replacementRequest.status || 'pending';
    }
    return 'none';
  };

  const getRequestDetails = (order) => {
    if (order.returnRequest?.requestedAt) {
      return order.returnRequest;
    }
    if (order.replacementRequest?.requestedAt) {
      return order.replacementRequest;
    }
    return {};
  };

  const handleRequestAction = (order, action) => {
    const hasReturnRequest = Boolean(order.returnRequest?.requestedAt);
    const hasReplacementRequest = Boolean(order.replacementRequest?.requestedAt);

    let requestType;
    if (hasReturnRequest) {
      requestType = 'return';
    } else if (hasReplacementRequest) {
      requestType = 'replacement';
    } else {
      alert('No valid request found for this order. Request must have requestedAt timestamp.');
      console.error('Invalid request state:', { returnRequest: order.returnRequest, replacementRequest: order.replacementRequest });
      return;
    }

    const actionLabel = action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : action === 'complete' ? 'Complete' : action === 'delete' ? 'Delete' : action;
    if (!window.confirm(`Are you sure you want to ${actionLabel.toLowerCase()} this ${requestType} request?`)) return;

    const payload = {
      requestType,
      requestAction: action,
      notes: `Admin action: ${actionLabel}`
    };

    if (action === 'complete' && requestType === 'return' && order.paymentMethod === 'cod') {
      const accountHolder = prompt('Enter bank account holder name:');
      const accountNumber = prompt('Enter bank account number:');
      const ifsc = prompt('Enter IFSC code:');
      if (!accountHolder || !accountNumber || !ifsc) {
        alert('Bank details are required to complete COD refund.');
        return;
      }
      payload.bankDetails = { accountHolder, accountNumber, ifsc };
    }

    console.log('Request action payload:', payload, 'orderId:', order._id, 'order returnRequest:', order.returnRequest, 'replacementRequest:', order.replacementRequest);
    updateOrderStatus(order._id, undefined, payload);
    setSelectedRequest(null);
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => fetchOrders(false), 300000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const getTotalQuantity = (order) => order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  const formatItemDetails = (items) => {
    if (!items || items.length === 0) return 'No items';
    return items.map(item => {
      const details = [item.selectedColor, item.selectedSize].filter(Boolean).join(', ');
      return `${item.name}${details ? ` (${details})` : ''} x${item.quantity}`;
    }).join('\n');
  };

  if (loading) return <div className="loading">Loading Data...</div>;

  const requestOrders = orders.filter(order => hasValidRequest(order));
  
  const filteredRequestOrders = requestOrders.filter(order => {
    if (requestFilter === 'all') return true;
    const currentStatus = getRequestStatus(order);
    return currentStatus === requestFilter;
  });

  const formatShippingAddress = (address) => {
    if (!address) return 'No address available';
    
    // Check if Kuwait address (has governorate field)
    if (address.governorate) {
      const lines = [
        address.addressTitle ? `${address.addressTitle}` : '',
        address.houseNumber ? `Block: ${address.block}, Street: ${address.street}, House: ${address.houseNumber}` : '',
        address.apartment ? `Apt: ${address.apartment}` : '',
        address.floor ? `Floor: ${address.floor}` : '',
        address.area ? `${address.area}, ${address.governorate}` : '',
        address.jadda ? `Details: ${address.jadda}` : '',
        address.phone ? `Phone: ${address.phone}` : ''
      ];
      return lines.filter(Boolean).join('\n');
    } else {
      // India address (has city field)
      const lines = [
        address.houseNumber ? `House No: ${address.houseNumber}` : '',
        address.street || '',
        `${address.city || ''}${address.city && address.state ? ', ' : ''} ${address.state || ''}`.trim(),
        address.pincode ? `Pincode: ${address.pincode}` : '',
        address.phone ? `Phone: ${address.phone}` : ''
      ];
      return lines.filter(Boolean).join('\n');
    }
  };

  return (
    <div className="order-list">
      
      {/* CENTERED GLOBAL REFRESH LOADER */}
      {isRefreshing && (
        <div className="global-refresh-overlay">
          <div className="global-spinner"></div>
          <p>Refreshing Data...</p>
        </div>
      )}

      {showOnlyRequests && requestOrders.length > 0 && (
      <div className="returned-orders-panel">
        <div className="returned-orders-header">
          <div>
            <h3>Return / Replacement Requests</h3>
            <p>{requestOrders.length} active request{requestOrders.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="refresh-btn" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? <span className="btn-spinner"></span> : 'Refresh Requests'}
          </button>
        </div>
        <div className="request-filter-group">
          {['all', 'pending', 'approved', 'processing', 'completed', 'rejected'].map((filter) => (
            <button
              key={filter}
              type="button"
              className={`request-filter-btn ${requestFilter === filter ? 'active' : ''}`}
              onClick={() => setRequestFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        
        {filteredRequestOrders.length === 0 ? (
          <div className="returned-orders-empty">No requests match the selected filter.</div>
        ) : (
          <div className="returned-orders-grid">
            {filteredRequestOrders.map((order) => {
              const requestType = getRequestType(order);
              const requestStatus = getRequestStatus(order);
              const requestDetails = getRequestDetails(order);
              const proofCount = (requestDetails.proofImages || []).length;
              const bankInfo = requestDetails.bankDetails
                ? `${requestDetails.bankDetails.bankName || ''} ${requestDetails.bankDetails.accountNumber || ''}`.trim()
                : 'N/A';

              return (
                <div key={order._id} className="returned-order-card">
                  <div className="returned-order-top">
                    <span className="returned-order-id">{order.orderId}</span>
                    <span className={`status-badge ${requestStatus}`}>{requestStatus.toUpperCase()}</span>
                  </div>
                  <div><strong>{order.userId?.name || 'Unknown'}</strong></div>
                  <div>{order.userId?.email || 'No email'}</div>
                  <div>{requestType}</div>
                  <div style={{whiteSpace: 'nowrap'}}>{order.currencySymbol || '₹'}{formatPrice(order.totalAmount, order.currencySymbol)}</div>
                  <div className="returned-order-notes">{requestDetails.reason || requestDetails.details}</div>
                  <div className="returned-order-meta">
                    <span>{proofCount} Proof Image{proofCount !== 1 ? 's' : ''}</span>
                    {requestType === 'Return' && order.paymentMethod === 'cod' && (
                      <span>Bank: {bankInfo}</span>
                    )}
                  </div>
                  <div className="returned-order-actions">
                    <button className="details-btn" onClick={() => { setSelectedRequest(order); setShowRequestImages(false); }}>
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* MODAL SECTION */}
      {showOnlyRequests && selectedRequest && (
        <div className="request-details-modal" onClick={() => { setSelectedRequest(null); setShowRequestImages(false); }}>
          <div className="request-details-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Details</h3>
              <button type="button" className="modal-close" onClick={() => { setSelectedRequest(null); setShowRequestImages(false); }}>×</button>
            </div>
            
            <div className="modal-body-scroll">
              <p><strong>Order:</strong> {selectedRequest.orderId}</p>
              <p><strong>Customer:</strong> {selectedRequest.userId?.name || 'Unknown'}</p>
              <p><strong>Email:</strong> {selectedRequest.userId?.email || 'N/A'}</p>
              <p><strong>Type:</strong> {getRequestType(selectedRequest)}</p>
              <p><strong>Status:</strong> <span className={`status-badge ${getRequestStatus(selectedRequest)}`}>{getRequestStatus(selectedRequest).toUpperCase()}</span></p>
              <p><strong>Reason:</strong> {getRequestDetails(selectedRequest).reason || getRequestDetails(selectedRequest).details || 'N/A'}</p>
              <p><strong>Proof count:</strong> {(getRequestDetails(selectedRequest).proofImages || []).length}</p>
              <button
                type="button"
                className="show-images-btn"
                onClick={() => setShowRequestImages(prev => !prev)}
                style={{ marginTop: '12px', marginBottom: '12px' }}
              >
                {showRequestImages ? 'Hide Images' : 'Show Images'}
              </button>
              {showRequestImages && (getRequestDetails(selectedRequest).proofImages || []).length > 0 && (
                <div className="proof-images-row" style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '8px' }}>
                  {(getRequestDetails(selectedRequest).proofImages || []).map((src, index) => (
                    <a
                      key={index}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="proof-image-link"
                      style={{ minWidth: '120px', maxWidth: '160px', display: 'inline-block' }}
                    >
                      <img
                        src={src}
                        alt={`proof-${index}`}
                        style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                    </a>
                  ))}
                </div>
              )}
              {showRequestImages && (getRequestDetails(selectedRequest).proofImages || []).length === 0 && (
                <p style={{ marginTop: '8px', color: '#555' }}>No proof images available yet.</p>
              )}
              {getRequestDetails(selectedRequest).bankDetails && (
                <div className="bank-details-box">
                  <p><strong>Bank Name:</strong> {getRequestDetails(selectedRequest).bankDetails.bankName || 'N/A'}</p>
                  <p><strong>Account No:</strong> {getRequestDetails(selectedRequest).bankDetails.accountNumber || 'N/A'}</p>
                  <p><strong>IFSC:</strong> {getRequestDetails(selectedRequest).bankDetails.ifscCode || 'N/A'}</p>
                </div>
              )}
            </div>

            <div className="modal-footer-actions">
              {getRequestStatus(selectedRequest) === 'pending' && (
                <>
                  <button className="approve-btn" onClick={() => handleRequestAction(selectedRequest, 'approve')}><i className="fa-solid fa-check"></i> Approve</button>
                  <button className="reject-btn" onClick={() => handleRequestAction(selectedRequest, 'reject')}><i className="fa-solid fa-xmark"></i> Reject</button>
                </>
              )}
              {(getRequestStatus(selectedRequest) === 'approved' || getRequestStatus(selectedRequest) === 'processing') && (
                <button className="complete-btn" onClick={() => handleRequestAction(selectedRequest, 'complete')}><i className="fa-solid fa-check-circle"></i> Mark Completed</button>
              )}
              <button className="delete-req-btn" onClick={() => handleRequestAction(selectedRequest, 'delete')}><i className="fa-solid fa-trash"></i> Delete Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Order Tables */}
      {!showOnlyRequests && (
      <div className="order-header">
        <h2>Order Management</h2>
        <div className="last-update">
            <i className="fas fa-clock"></i>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        <div className="order-controls">
          <div className="control-group">
            <span>Auto Accept</span>
            <button type="button" className={`toggle-switch-ord ${autoAccept ? 'on' : 'off'}`} onClick={() => setAutoAccept(!autoAccept)}>
              <span className="toggle-thumb" />
            </button>
          </div>
          <div className="control-group">
            <span>Auto Refresh</span>
            <button type="button" className={`toggle-switch-ord ${autoRefresh ? 'on' : 'off'}`} onClick={() => setAutoRefresh(!autoRefresh)}>
              <span className="toggle-thumb" />
            </button>
          </div>
          <button className="refresh-btn" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
          </button>
        </div>
      </div>
      )}

      {!showOnlyRequests && (
      <div className="order-table-container">
        <table className="order-table">
          <thead>
            <tr>
              <th>Sr</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Address</th>
              <th>Items</th>
              <th>Qty</th>
              <th>Details</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={order._id}>
                <td>{index + 1}</td>
                <td>{order.orderId}</td>
                <td>
                  <div>{order.userId?.name || 'Guest'}</div>
                  <div className="customer-phone">{order.userId?.phone || order.shippingAddress?.phone || 'No phone'}</div>
                </td>
                <td>
                  <div className="order-address">
                    {formatShippingAddress(order.shippingAddress).split('\n').map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                    {order.shippingAddress?.mapLink && (
                      <div style={{marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb'}}>
                        <a 
                          href={order.shippingAddress.mapLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontWeight: '500',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                          📍 View on Maps
                        </a>
                        {order.shippingAddress?.latitude && order.shippingAddress?.longitude && (
                          <div style={{fontSize: '11px', color: '#6b7280', marginTop: '4px'}}>
                            Lat: {order.shippingAddress.latitude.toFixed(4)}, Lng: {order.shippingAddress.longitude.toFixed(4)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td>{order.items?.length || 0}</td>
                <td>{getTotalQuantity(order)}</td>
                <td>
                  <div className="order-details">
                    {formatItemDetails(order.items).split('\n').map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                  </div>
                </td>
                <td style={{whiteSpace: 'nowrap'}}>{order.currencySymbol || '₹'}{formatPrice(order.totalAmount, order.currencySymbol)}</td>
                <td>
                  <span className={`payment-status ${order.paymentStatus}`}>
                    {order.paymentStatus === 'completed' ? 'Paid' : order.paymentMethod === 'cod' ? 'COD' : 'Pending'}
                  </span>
                </td>
                <td>
                  <span className={`order-status ${order.orderStatus}`}>
                    {order.orderStatus === 'cancelled'
                      ? `CANCELLED`
                      : order.orderStatus.replace('-', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="actions-cell">
                   {order.orderStatus === 'pending' && (
                    <>
                      <button className="accept-btn" onClick={() => acceptOrder(order._id)}><i className="fa-solid fa-check"></i> Confirm</button>
                      <button className="cancel-btn" onClick={() => cancelOrder(order._id)}><i className="fa-solid fa-xmark"></i> Cancel</button>
                    </>
                  )}
                  {order.orderStatus === 'confirmed' && (
                    <>
                      <button className="process-btn" onClick={() => moveToProcessing(order._id)}><i className="fa-solid fa-box"></i> Processing</button>
                      <button className="cancel-btn" onClick={() => cancelOrder(order._id)}><i className="fa-solid fa-xmark"></i> Cancel</button>
                    </>
                  )}
                  {order.orderStatus === 'processing' && (
                    <>
                      <button className="ship-btn" onClick={() => handleShipOrder(order._id)}><i className="fa-solid fa-shipping-fast"></i> Ship</button>
                      <button className="cancel-btn" onClick={() => cancelOrder(order._id)}><i className="fa-solid fa-xmark"></i> Cancel</button>
                    </>
                  )}
                  {order.orderStatus === 'shipped' && (
                    <button className="delivery-btn" onClick={() => markOutForDelivery(order._id)}><i className="fa-solid fa-truck-fast"></i> Out for Delivery</button>
                  )}
                  {order.orderStatus === 'out-for-delivery' && (
                    <button className="delivered-btn" onClick={() => markDelivered(order._id)}><i className="fa-solid fa-check"></i> Delivered</button>
                  )}
                  {order.orderStatus === 'delivered' && (
                    <>
                      <span className="status-label">Delivered</span>
                      <button className="returned-btn" onClick={() => markReturned(order._id)}><i className="fa-solid fa-rotate-left"></i> Return</button>
                      <button className="replacement-btn" onClick={() => markReplaced(order._id)}><i className="fa-solid fa-sync-alt"></i> Replace</button>
                    </>
                  )}
                  {shouldShowRefundButton(order) && (
                    <button className="refund-btn" onClick={() => markRefunded(order)}><i className="fa-solid fa-dollar-sign"></i> Refund</button>
                  )}
                  {order.orderStatus === 'refunded' && (
                    <span className="status-label">Refunded</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}