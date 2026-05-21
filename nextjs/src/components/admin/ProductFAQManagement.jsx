'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FAQManagement.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ProductFAQManagement() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: ''
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    fetchProductFAQs();
  }, []);

  const fetchProductFAQs = async () => {
    try {
      const response = await axios.get(`${API_URL}/product-faqs/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFaqs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching product FAQs:', error);
      setMessage('❌ Failed to load FAQs');
      setFaqs([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingFaq) {
        await axios.put(`${API_URL}/product-faqs/${editingFaq._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('✅ FAQ updated successfully');
      } else {
        await axios.post(`${API_URL}/product-faqs`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('✅ FAQ created successfully');
      }

      fetchProductFAQs();
      resetForm();
    } catch (error) {
      setMessage('❌ Failed to save FAQ');
      console.error('Error saving FAQ:', error);
    } finally {
      setLoading(false);
    }

    setTimeout(() => setMessage(''), 5000);
  };

  const handleEdit = (faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      await axios.delete(`${API_URL}/product-faqs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ FAQ deleted successfully');
      fetchProductFAQs();
    } catch (error) {
      setMessage('❌ Failed to delete FAQ');
      console.error('Error deleting FAQ:', error);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axios.patch(`${API_URL}/product-faqs/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ FAQ status updated');
      fetchProductFAQs();
    } catch (error) {
      setMessage('❌ Failed to update FAQ status');
      console.error('Error toggling FAQ status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: ''
    });
    setEditingFaq(null);
    setShowForm(false);
  };

  return (
    <div className="faq-management">
      <div className="faq-header">
        <h2>Product FAQ Management</h2>
        <button onClick={() => setShowForm(!showForm)} className="add-faq-btn">
          {showForm ? 'Cancel' : '+ Add New FAQ'}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="faq-form-container">
          <form onSubmit={handleSubmit} className="faq-form">
            <h3>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</h3>

            <div className="form-group">
              <label>Question *</label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                required
                placeholder="Enter the FAQ question"
              />
            </div>

            <div className="form-group">
              <label>Answer *</label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                required
                placeholder="Enter the detailed answer"
                rows="4"
              />
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="save-btn">
                {loading ? 'Saving...' : (editingFaq ? 'Update FAQ' : 'Create FAQ')}
              </button>
              <button type="button" onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="faq-list">
        <div className="faq-list-header">
          <h3>All Product FAQs ({faqs.length})</h3>
        </div>

        {faqs.length === 0 ? (
          <div className="no-faqs">
            <p>No product FAQs found. Add one to show the same FAQ list across all products.</p>
          </div>
        ) : (
          <div className="faq-items">
            {faqs.map((faq, index) => (
              <div key={faq._id || index} className="faq-item">
                <div className="faq-content">
                  <h4 className="question">Q{index + 1}: {faq.question}</h4>
                  <p className="answer">{faq.answer}</p>
                  <div className="faq-actions">
                    <button onClick={() => handleToggleStatus(faq._id)} className="edit-btn">
                      {faq.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => handleEdit(faq)} className="edit-btn">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(faq._id)} className="delete-btn">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
