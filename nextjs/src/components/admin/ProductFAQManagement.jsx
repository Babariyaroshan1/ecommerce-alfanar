'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FAQManagement.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ProductFAQManagement() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
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
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchProductFAQs();
    } else {
      setFaqs([]);
    }
  }, [selectedProduct]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage('❌ Failed to load products');
    }
  };

  const fetchProductFAQs = async () => {
    try {
      const response = await axios.get(`${API_URL}/product-faqs/${selectedProduct}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFaqs(response.data);
    } catch (error) {
      console.error('Error fetching product FAQs:', error);
      setMessage('❌ Failed to load FAQs');
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
        await axios.post(`${API_URL}/product-faqs/${selectedProduct}`, formData, {
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

  const handleToggleStatus = async (id, currentStatus) => {
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
    <div className="faq-management-container">
      <h2 className="faq-title">Product FAQs Management</h2>

      {message && <div className="faq-message">{message}</div>}

      <div className="faq-selector">
        <label>Select Product:</label>
        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="faq-select">
          <option value="">-- Choose a Product --</option>
          {products.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProduct && (
        <>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="faq-btn faq-btn-add">
              + Add FAQ
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="faq-form">
              <h3>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</h3>
              
              <div className="form-group">
                <label>Question *</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter question"
                  required
                  className="faq-input"
                />
              </div>

              <div className="form-group">
                <label>Answer *</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Enter answer"
                  required
                  rows="5"
                  className="faq-textarea"
                />
              </div>

              <div className="form-actions">
                <button type="submit" disabled={loading} className="faq-btn faq-btn-save">
                  {loading ? 'Saving...' : 'Save FAQ'}
                </button>
                <button type="button" onClick={resetForm} className="faq-btn faq-btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="faq-list">
            <h3>FAQs for Selected Product</h3>
            {faqs.length === 0 ? (
              <p className="faq-empty">No FAQs for this product yet.</p>
            ) : (
              faqs.map((faq, index) => (
                <div key={faq._id} className="faq-item">
                  <div className="faq-item-header">
                    <span className="faq-number">Q{index + 1}:</span>
                    <span className="faq-question">{faq.question}</span>
                    <span className={`faq-status ${faq.isActive ? 'active' : 'inactive'}`}>
                      {faq.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="faq-item-answer">{faq.answer}</div>
                  <div className="faq-item-actions">
                    <button onClick={() => handleToggleStatus(faq._id, faq.isActive)} className="faq-btn faq-btn-toggle">
                      {faq.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => handleEdit(faq)} className="faq-btn faq-btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(faq._id)} className="faq-btn faq-btn-delete">
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
