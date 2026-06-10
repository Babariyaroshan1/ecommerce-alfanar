'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ProductReviewsManagement.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ProductReviewsManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [formData, setFormData] = useState({ rating: 5, comment: '', approved: true });
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/reviews/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(response.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setMessage('[ERROR] Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setFormData({
      rating: review.rating || 5,
      comment: review.comment || '',
      approved: review.approved !== false
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingReview) return;

    try {
      await axios.put(`${API_URL}/reviews/${editingReview._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('[SUCCESS] Review updated successfully');
      setEditingReview(null);
      fetchReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      setMessage('[ERROR] Failed to update review');
    }

    setTimeout(() => setMessage(''), 5000);
  };

  const handleDelete = async (reviewId) => {
    if (!confirm('Delete this review?')) return;
    try {
      await axios.delete(`${API_URL}/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('[SUCCESS] Review deleted');
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      setMessage('[ERROR] Failed to delete review');
    }

    setTimeout(() => setMessage(''), 5000);
  };

  const handleToggleApprove = async (review) => {
    try {
      await axios.put(`${API_URL}/reviews/${review._id}`, { approved: !review.approved }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`[SUCCESS] Review ${review.approved ? 'unapproved' : 'approved'}`);
      fetchReviews();
    } catch (error) {
      console.error('Error toggling approval:', error);
      setMessage('[ERROR] Failed to update review approval');
    }

    setTimeout(() => setMessage(''), 5000);
  };

  const resetForm = () => {
    setEditingReview(null);
    setFormData({ rating: 5, comment: '', approved: true });
  };

  return (
    <div className="review-management">
      <div className="review-header">
        <h2>Product Review Management</h2>
        <p>Manage customer reviews, edit feedback, and approve or remove reviews.</p>
      </div>

      {message && (
        <div className={`message ${message.includes('[SUCCESS]') ? 'success' : 'error'}`}>{message}</div>
      )}

      {editingReview && (
        <form onSubmit={handleSave} className="review-edit-form">
          <h3>Edit Review for {editingReview.productId?.name || 'Product'}</h3>
          <div className="form-row">
            <label>Rating</label>
            <select
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Comment</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows="4"
            />
          </div>
          <div className="form-row form-row-inline">
            <label>Approved</label>
            <button
              type="button"
              className={`approve-btn ${formData.approved ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, approved: !formData.approved })}
            >
              {formData.approved ? 'Approved' : 'Not Approved'}
            </button>
          </div>
          <div className="action-row">
            <button type="submit" className="save-btn">Save Changes</button>
            <button type="button" onClick={resetForm} className="cancel-btn">Cancel</button>
          </div>
        </form>
      )}

      <div className="reviews-table-wrapper">
        <table className="reviews-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Reviewer</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Status</th>
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6">Loading reviews...</td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan="6">No reviews found.</td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review._id}>
                  <td>{review.productId?.name || 'Unknown'}</td>
                  <td>{review.userName || 'Customer'}</td>
                  <td>{'★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)}</td>
                  <td className="comment-cell">{review.comment || 'No comment'}</td>
                  <td>{review.approved ? 'Approved' : 'Pending'}</td>
                  <td className="action-buttons">
                    <button onClick={() => handleEdit(review)} className="edit-btn">Edit</button>
                    <button onClick={() => handleToggleApprove(review)} className="approve-toggle-btn">
                      {review.approved ? 'Unapprove' : 'Approve'}
                    </button>
                    <button onClick={() => handleDelete(review._id)} className="delete-btn">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
