import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Coupons.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    minPurchase: 0,
    description: '',
    isActive: true
  });
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(response.data || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setForm({
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      minPurchase: 0,
      description: '',
      isActive: true
    });
    setError('');
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchase: coupon.minPurchase,
      description: coupon.description,
      isActive: coupon.isActive
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.description.trim()) {
      setError('Please fill out coupon code and description.');
      return;
    }

    try {
      const payload = {
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minPurchase: Number(form.minPurchase),
        description: form.description,
        isActive: form.isActive
      };

      if (editingCoupon) {
        await axios.put(`${API_URL}/coupons/${editingCoupon._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/coupons`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      resetForm();
      fetchCoupons();
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to save coupon';
      setError(message);
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await axios.delete(`${API_URL}/coupons/${couponId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCoupons();
    } catch (err) {
      console.error(err);
      setError('Failed to delete coupon');
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      const updatedCoupon = { ...coupon, isActive: !coupon.isActive };
      await axios.put(`${API_URL}/coupons/${coupon._id}`, updatedCoupon, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCoupons();
    } catch (err) {
      console.error(err);
      setError('Failed to update coupon status');
    }
  };

  return (
    <div className="coupon-management-container">
      <h2>Coupon Management</h2>
      <div>
        <section className="coupon-form-section">
          <h3>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h3>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Coupon Code</label>
                <input name="code" value={form.code} onChange={handleChange} placeholder="e.g. SAVE10" />
              </div>
              <div className="form-group">
                <label>Discount Type</label>
                <select name="discountType" value={form.discountType} onChange={handleChange}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Discount Value</label>
                <input name="discountValue" type="number" min="0" step="0.01" value={form.discountValue} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Minimum Purchase</label>
                <input name="minPurchase" type="number" min="0" step="0.01" value={form.minPurchase} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="3" placeholder="e.g. 10% off on orders over 15.000 KWD" />
            </div>
            <div className="active-checkbox-group">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} id="couponActive" />
              <label htmlFor="couponActive">Active</label>
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-btn">{editingCoupon ? 'Save Coupon' : 'Create Coupon'}</button>
              <button type="button" className="cancel-btn" onClick={resetForm}>Clear</button>
            </div>
          </form>
        </section>

        <section className="coupon-list-section">
          <h3>Existing Coupons</h3>
          {loading ? (
            <div className="loading">Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <p className="empty-state">No coupons created yet.</p>
          ) : (
            <div className="coupon-table-container">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Min Purchase</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(coupon => (
                    <tr key={coupon._id}>
                      <td>{coupon.code}</td>
                      <td>{coupon.discountType}</td>
                      <td>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : coupon.discountValue}</td>
                      <td>{coupon.minPurchase}</td>
                      <td>{coupon.description}</td>
                      <td className="status-cell">
                        <div className="toggle-switch-container">
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={coupon.isActive}
                              onChange={() => handleToggleActive(coupon)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                          <span className="toggle-label">{coupon.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="edit-btn" onClick={() => handleEdit(coupon)}>Edit</button>
                          <button className="delete-btn" onClick={() => handleDelete(coupon._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
