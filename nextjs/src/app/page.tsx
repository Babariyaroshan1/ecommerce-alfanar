// @ts-nocheck

'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import ProductCard from '../components/ProductCard';
import { useTranslation } from 'react-i18next';
import { useProductStore } from '../store/productStore';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../Home.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production

const Home = () => {
  const { t } = useTranslation();
  const products = useProductStore((state) => state.products);
  const loading = useProductStore((state) => state.loading);
  const fetchProducts = useProductStore((state) => state.fetchProducts);

  // FAQ state
  const [activeFaq, setActiveFaq] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [faqsLoading, setFaqsLoading] = useState(true);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Fetch FAQs
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await axios.get(`${API_URL}/faqs`);
        setFaqs(response.data);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        // Fallback to empty array if API fails
        setFaqs([]);
      } finally {
        setFaqsLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  const featuredProducts = products.filter((product) => Boolean(product.isFeaturedOnHome));
  const displayProducts = featuredProducts.slice(0, 8);

  return (
    <div className="home-container container py-5">
      
      {/* Top Header Section (Breadcrumbs & Title) */}
      {/* <div className="text-center mb-5">
        <div className="breadcrumbs text-muted mb-2" style={{ fontSize: '13px' }}>
          <span>Home</span> <span className="mx-2">{'>'}</span> <span className="text-dark">Burqa</span>
        </div>
        <h2 className="page-title fw-bold">Burqa</h2>
      </div> */}
      
      {/* AL-FANAR POSTER / BANNER SECTION */}
      <div className="banner-poster-container mb-5 text-center">
        <img 
          // Yahan apni AL-FANAR wali poster ki image URL daalein
          src="/banner.png" 
          alt="AL-FANAR Details Poster" 
          className="img-fluid w-100 rounded shadow-sm custom-banner-img" 
        />
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <span className="text-dark text-decoration-none fs-4 text-sm">
            {t('Best selling')}
          </span>
          {/* <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
            Home page shows only featured products. Mark up to 8 products as featured, and only 6 appear here.
          </p> */}
        </div>
        <Link href="/products" className="btn btn-outline-white bg-black text-white rounded-0">
          Explore all
        </Link>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="text-center mb-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading products...</p>
        </div>
      )}

      {/* Product Grid */}
      {!loading && displayProducts.length === 0 && (
        <div className="text-center mb-4">
          <p className="text-muted">No products are currently featured on the home page.</p>
        </div>
      )}
      {!loading && displayProducts.length > 0 && (
        <div className="row g-4">
          {displayProducts.map(product => (
            <div key={product._id || product.id} className="col-6 col-sm-6 col-md-4 col-lg-3">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}

      {/* FAQ SECTION */}
      <div className="faq-section mt-5 pt-5">
        <div className="text-center mb-4">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <p className="faq-subtitle text-muted">Find answers to common questions about our products and services</p>
        </div>

        <div className="faq-container">
          {faqsLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading FAQs...</span>
              </div>
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No FAQs available at the moment.</p>
            </div>
          ) : (
            faqs.map((faq, index) => (
              <div key={faq._id} className={`faq-item ${activeFaq === index ? 'active' : ''}`}>
                <div className="faq-question" onClick={() => toggleFaq(index)}>
                  <span>{faq.question}</span>
                  <span className="faq-toggle">+</span>
                </div>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default Home;