'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import UserOrderHistory from './UserOrderHistory';
import './UserList.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (isMounted) {
          setUsers(res.data || []);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

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

  const getUserLocation = (user) => {
    if (user?.address?.governorate) {
      const area = user.address.area ? `${user.address.area}` : '';
      const governorate = user.address.governorate ? `${user.address.governorate}` : '';
      return [area, governorate].filter(Boolean).join(', ') || '—';
    }

    if (user?.address?.city || user?.address?.state) {
      return [user.address.city, user.address.state].filter(Boolean).join(', ') || '—';
    }

    return '—';
  };

  const getTotalOrders = (user) => {
    if (typeof user?.totalOrders === 'number') return user.totalOrders;
    if (typeof user?.orderCount === 'number') return user.orderCount;
    if (Array.isArray(user?.orders)) return user.orders.length;
    return '—';
  };

  const getStatusText = (user) => {
    if (user?.status) return user.status;
    if (user?.accountStatus) return user.accountStatus;
    if (typeof user?.isActive === 'boolean') {
      return user.isActive ? 'Active' : 'Inactive';
    }
    return '—';
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
                  const initial = String(user?.name || 'U').trim().charAt(0).toUpperCase();
                  const statusText = getStatusText(user);

                  return (
                    <tr
                      key={user?._id || user?.id}
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
                          <div>
                            <div className="user-name">{user?.name || 'Unnamed User'}</div>
                            <div className="user-meta">Customer</div>
                          </div>
                        </div>
                      </td>
                      <td>{user?.email || '—'}</td>
                      <td>{user?.phone || '—'}</td>
                      <td>{getUserLocation(user)}</td>
                      <td>{getTotalOrders(user)}</td>
                      <td>
                        <span className={`status-badge ${statusText === 'Active' ? 'active' : statusText === 'Inactive' ? 'inactive' : 'neutral'}`}>
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