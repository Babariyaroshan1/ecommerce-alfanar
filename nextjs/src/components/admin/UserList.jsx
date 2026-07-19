'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import UserOrderHistory from './UserOrderHistory';
import './UserList.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAddressValue = (address, keys) => {
  return keys.reduce((value, key) => {
    if (value) return value;
    const item = address?.[key];
    return item ? String(item).trim() : '';
  }, '');
};

const getLocationFromAddress = (address) => {
  if (!address || typeof address !== 'object') return '';

  const parts = [
    getAddressValue(address, ['area', 'block', 'street', 'houseNumber', 'apartment', 'floor', 'jadda']),
    getAddressValue(address, ['governorate']),
    getAddressValue(address, ['city', 'state']),
    getAddressValue(address, ['country'])
  ].filter(Boolean);

  return parts.join(', ');
};

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [orderStats, setOrderStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    let isMounted = true;

    const fetchUsersAndOrders = async () => {
      if (!token) {
        if (isMounted) {
          setUsers([]);
          setOrderStats({});
          setLoading(false);
        }
        return;
      }

      try {
        const [usersResponse, ordersResponse] = await Promise.all([
          axios.get(`${API_URL}/auth/admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/orders/admin/all`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!isMounted) return;

        const usersData = usersResponse.data || [];
        const ordersData = ordersResponse.data || [];
        const stats = {};

        ordersData.forEach((order) => {
          const userId = order?.userId?._id || order?.userId || order?.user?.id;
          if (!userId) return;

          if (!stats[userId]) {
            stats[userId] = {
              totalOrders: 0,
              latestOrderStatus: '',
              location: ''
            };
          }

          stats[userId].totalOrders += 1;

          if (order?.orderStatus && !stats[userId].latestOrderStatus) {
            stats[userId].latestOrderStatus = order.orderStatus;
          }

          const candidateLocation = getLocationFromAddress(order?.shippingAddress || order?.deliveryAddress || order?.address);
          if (!stats[userId].location && candidateLocation) {
            stats[userId].location = candidateLocation;
          }
        });

        setUsers(usersData);
        setOrderStats(stats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsersAndOrders();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const name = String(user?.name || '').toLowerCase();
      const email = String(user?.email || '').toLowerCase();
      const phone = String(user?.phone || '').toLowerCase();
      return name.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [searchTerm, users]);

  const getUserLocation = (user, userStats) => {
    const addressLocation = getLocationFromAddress(user?.address || user?.addresses?.[0] || user?.shippingAddress || user?.deliveryAddress);
    const orderLocation = userStats?.location || '';
    return orderLocation || addressLocation || 'Not Available';
  };

  const getTotalOrders = (user, userStats) => {
    if (typeof user?.totalOrders === 'number') return user.totalOrders;
    if (typeof user?.orderCount === 'number') return user.orderCount;
    if (typeof userStats?.totalOrders === 'number') return userStats.totalOrders;
    if (Array.isArray(user?.orders)) return user.orders.length;
    return 0;
  };

  const getStatusText = (user, userStats) => {
    if (user?.status) return user.status;
    if (user?.accountStatus) return user.accountStatus;
    if (typeof user?.isActive === 'boolean') {
      return user.isActive ? 'Active' : 'Inactive';
    }
    if (user?.isBlocked || user?.blocked || user?.isAccountBlocked) {
      return 'Blocked';
    }

    const totalOrders = getTotalOrders(user, userStats);
    if (totalOrders > 1) return 'Returning Customer';
    if (totalOrders === 1) return 'First Order';

    return 'Unknown';
  };

  const handleViewOrders = (event, user) => {
    event.stopPropagation();
    setSelectedUser(user);
  };

  if (selectedUser) {
    return (
      <UserOrderHistory
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  return (
    <div className="user-list-container">
      <div className="user-list-shell">
        <div className="user-list-header">
          <div>
            <p className="user-list-eyebrow">Customer Overview</p>
            <h2>User Management</h2>
            <p className="user-list-subtitle">Manage registered users and customer information.</p>
          </div>

          <div className="search-container">
            <i className="fa-solid fa-magnifying-glass search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <span>Loading users...</span>
          </div>
        ) : (
          <div className="table-shell">
            <table className="user-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Total Orders</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const userId = user?._id || user?.id;
                  const initial = String(user?.name || 'U').trim().charAt(0).toUpperCase();
                  const userStats = orderStats[userId] || {};
                  const statusText = getStatusText(user, userStats);
                  const totalOrders = getTotalOrders(user, userStats);
                  const locationText = getUserLocation(user, userStats);
                  const statusClassName = statusText === 'Active'
                    ? 'active'
                    : statusText === 'Inactive'
                      ? 'inactive'
                      : statusText === 'Blocked'
                        ? 'blocked'
                        : statusText === 'Returning Customer'
                          ? 'returning'
                          : statusText === 'First Order'
                            ? 'first-order'
                            : 'neutral';

                  return (
                    <tr
                      key={userId}
                      className="user-table-row"
                      onClick={() => setSelectedUser(user)}
                    >
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {user?.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt={user?.name || 'User avatar'}
                                onError={(event) => {
                                  event.currentTarget.src = '/default-avatar.png';
                                }}
                              />
                            ) : (
                              <span>{initial}</span>
                            )}
                          </div>
                          <div className="user-info-stack">
                            <div className="user-name-row">
                              <div className="user-name">{user?.name || 'Unnamed User'}</div>
                              <span className="user-pill">Customer</span>
                            </div>
                            <div className="user-meta">Registered customer</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="user-detail-text">{user?.email || '—'}</div>
                      </td>
                      <td>
                        <div className="user-detail-text">{user?.phone || '—'}</div>
                      </td>
                      <td>
                        <div className="user-location">{locationText}</div>
                      </td>
                      <td>
                        <div className="user-order-count">{totalOrders}</div>
                      </td>
                      <td>
                        <span className={`status-badge ${statusClassName}`}>
                          {statusText}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="view-orders-btn"
                          onClick={(event) => handleViewOrders(event, user)}
                        >
                          View Orders
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="empty-state">No users found</div>
        )}
      </div>
    </div>
  );
}