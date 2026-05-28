'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import UserOrderHistory from './UserOrderHistory';
import './UserList.css';
import './UserList.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

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
      <div className="user-list-header">
        <h2>All Users</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="user-grid">
          {filteredUsers.map((user) => (
            <div key={user._id} className="user-card" onClick={() => setSelectedUser(user)}>
              <div className="user-avatar">
                <img
                  src={user.profileImage || '/default-avatar.png'}
                  alt={user.name}
                  onError={(e) => {
                    e.target.src = '/default-avatar.png';
                  }}
                />
              </div>
              <div className="user-info">
                <h3 className="user-name">{user.name}</h3>
                <p className="user-email">{user.email}</p>
                <p className="user-phone">{user.phone}</p>
                <div className="user-address">
                  {user.address?.governorate ? (
                    <>
                      {user.address.area && <span>{user.address.area}</span>}
                      {user.address.governorate && <span>, {user.address.governorate}</span>}
                    </>
                  ) : (
                    <>
                      {user.address?.city && <span>{user.address.city}</span>}
                      {user.address?.state && <span>, {user.address.state}</span>}
                    </>
                  )}
                </div>
              </div>
              <div className="user-actions">
                <button className="view-orders-btn">View Orders</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredUsers.length === 0 && (
        <div className="no-users">No users found</div>
      )}
    </div>
  );
}