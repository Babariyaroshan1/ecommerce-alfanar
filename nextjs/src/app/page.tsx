// @ts-nocheck

'use client';

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';
import ProductCard from '../components/ProductCard';
import { SkeletonGrid } from '../components/ProductSkeleton';
import { FAQSkeletonGrid } from '../components/FAQSkeleton';
import BannerSkeleton from '../components/BannerSkeleton';
import { useTranslation } from 'react-i18next';
import { useProductStore } from '@/store/productStore';
// Note: Home fetches a small set of products locally for fast initial render
import 'bootstrap/dist/css/bootstrap.min.css';
import '../Home.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production
const GENERAL_FEATURED_LIMIT = 8;
const KIDS_FEATURED_LIMIT = 4;

const Home = () => {
  const { t } = useTranslation();
  const storeProducts = useProductStore((state) => state.products);
  const storeLoading = useProductStore((state) => state.loading);
  const fetchProducts = useProductStore((state) => state.fetchProducts);

  const isKidsCategory = (product) =>
    product?.isKidsProduct === true || String(product?.category || '').toLowerCase().includes('kid');
  const isPajamasCategory = (product) =>
    String(product?.category || '').toLowerCase().includes('pajama');
  const initialHomeLoad = useRef(storeProducts.length === 0);
  const homeSkeletonStart = useRef(Date.now());
  const minSkeletonDuration = 500;
  const [homeProducts, setHomeProducts] = useState(() => {
    if (!storeProducts || storeProducts.length === 0) return [];
    const featured = storeProducts.filter((product) => Boolean(product.isFeaturedOnHome)).slice(0, GENERAL_FEATURED_LIMIT);
    return featured.length > 0 ? featured : storeProducts.slice(0, GENERAL_FEATURED_LIMIT);
  });
  const [homeLoading, setHomeLoading] = useState(initialHomeLoad.current);

  // FAQ state
  const [activeFaq, setActiveFaq] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [faqsLoading, setFaqsLoading] = useState(true);
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [mobileBannerImageUrl, setMobileBannerImageUrl] = useState('');
  const [bannerLoading, setBannerLoading] = useState(true);

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

    const fetchSettings = async () => {
      try {
        setBannerLoading(true);
        const response = await axios.get(`${API_URL}/settings`);
        // console.log('[SUCCESS] Banner settings API response:', response.data);
        const desktop = response.data.homeBannerImageUrl || response.data.bannerImageUrl || '';
        const mobile = response.data.homeBannerMobileImageUrl || response.data.mobileBannerImageUrl || '';
        // console.log('[DEBUG] Desktop Banner URL:', desktop);
        // console.log('[DEBUG] Mobile Banner URL:', mobile);
        setBannerImageUrl(desktop);
        setMobileBannerImageUrl(mobile);
      } catch (error) {
        console.error('[ERROR] Error fetching banner settings:', error);
      } finally {
        setBannerLoading(false);
      }
    };

    fetchFAQs();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (storeProducts.length === 0) {
      fetchProducts();
      return;
    }

    const featured = storeProducts.filter((product) => Boolean(product.isFeaturedOnHome)).slice(0, GENERAL_FEATURED_LIMIT);
    setHomeProducts(featured.length > 0 ? featured : storeProducts.slice(0, GENERAL_FEATURED_LIMIT));

    if (initialHomeLoad.current) {
      const elapsed = Date.now() - homeSkeletonStart.current;
      const timer = setTimeout(
        () => setHomeLoading(false),
        Math.max(0, minSkeletonDuration - elapsed)
      );
      return () => clearTimeout(timer);
    }

    setHomeLoading(false);
  }, [fetchProducts, storeLoading, storeProducts]);

  useEffect(() => {
    if (initialHomeLoad.current && !storeLoading && storeProducts.length === 0) {
      const elapsed = Date.now() - homeSkeletonStart.current;
      const timer = setTimeout(
        () => setHomeLoading(false),
        Math.max(0, minSkeletonDuration - elapsed)
      );
      return () => clearTimeout(timer);
    }
  }, [storeLoading, storeProducts.length]);

  const generalFeaturedProducts = storeProducts
    .filter((product) => Boolean(product.isFeaturedOnHome) && !isKidsCategory(product) && !isPajamasCategory(product))
    .slice(0, GENERAL_FEATURED_LIMIT);
  const generalFallbackProducts = storeProducts
    .filter((product) => !isKidsCategory(product) && !isPajamasCategory(product))
    .slice(0, GENERAL_FEATURED_LIMIT);
  const displayProducts = generalFeaturedProducts.length > 0 ? generalFeaturedProducts : generalFallbackProducts;

  // Kids featured section: show up to 4 products that are marked as kids products and featured in admin
  const kidsFeatured = storeProducts
    .filter((p) => isKidsCategory(p) && Boolean(p.isFeaturedOnHome))
    .slice(0, KIDS_FEATURED_LIMIT);
  const pajamasFeatured = storeProducts
    .filter((p) => isPajamasCategory(p) && Boolean(p.isFeaturedOnHome));
  const kidsRef = useRef(null);
  const pajamasRef = useRef(null);
  const scrollKids = (dir) => {
    if (!kidsRef.current) return;
    kidsRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };
  const scrollPajamas = (dir) => {
    if (!pajamasRef.current) return;
    pajamasRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

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
      {bannerLoading ? (
        <BannerSkeleton />
      ) : bannerImageUrl || mobileBannerImageUrl ? (
        <div className="banner-poster-container mb-5 text-center">
          <picture>
            {mobileBannerImageUrl && (
              <source
                media="(max-width: 768px)"
                srcSet={mobileBannerImageUrl}
              />
            )}
            <img
              src={bannerImageUrl || mobileBannerImageUrl}
              alt="Homepage banner"
              loading="lazy"
              className="img-fluid w-100 rounded shadow-sm custom-banner-img"
              onError={(e) => {
                console.error('[ERROR] Banner image failed to load:', e.target.src);
                e.target.style.display = 'none';
              }}
              onLoad={() => {
                // console.log('[SUCCESS] Banner image loaded successfully');
              }}
            />
          </picture>
        </div>
      ) : (
        <div className="banner-poster-container mb-5 text-center" style={{ backgroundColor: '#f0f0f0', padding: '40px', borderRadius: '8px' }}>
          <p style={{ color: '#999', marginBottom: 0 }}>Banner not configured in admin settings yet</p>
        </div>
      )}

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
      {homeLoading && (
        <SkeletonGrid count={GENERAL_FEATURED_LIMIT} />
      )}

      {/* Product Grid */}
      {!homeLoading && displayProducts.length === 0 && (
        <div className="text-center mb-4">
          <p className="text-muted">No products are currently featured on the home page.</p>
        </div>
      )}
      {!homeLoading && displayProducts.length > 0 && (
        <div className="row g-4">
          {displayProducts.map(product => (
            <div key={product._id || product.id} className="col-6 col-sm-6 col-md-4 col-lg-3">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}

      {/* KIDS FEATURED SECTION (similar to Best selling) */}
      <div className="mt-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <span className="text-dark text-decoration-none fs-4 text-sm">Kids</span>
            <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>Featured kids collection</p>
          </div>
          <Link href="/kids" className="btn btn-outline-white bg-black text-white rounded-0">
            Explore kids
          </Link>
        </div>

        {homeLoading ? (
        <SkeletonGrid count={4} />
      ) : kidsFeatured.length === 0 ? (
          <div className="text-center mb-4">
            <p className="text-muted">No featured kids products available.</p>
          </div>
        ) : (
          <>
            {/* Desktop + Mobile slider */}
            <div className="position-relative slider-wrapper">
              <div
                ref={kidsRef}
                className="home-slider"
                style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '8px', scrollSnapType: 'x mandatory' }}
              >
                {kidsFeatured.map((product) => (
                  <div key={product._id || product.id} style={{ flex: '0 0 280px', width: '280px', maxWidth: '280px', scrollSnapAlign: 'center' }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

             <button
              aria-label="Previous"
              className="slider-nav-btn kids-nav-btn" // Added both classes
              onClick={() => scrollKids(-1)}
              style={{ left: 8 }} // Sirf position yahan rakhi hai
            >
              ‹
            </button>
            <button
              aria-label="Next"
              className="slider-nav-btn kids-nav-btn" // Added both classes
              onClick={() => scrollKids(1)}
              style={{ right: 8 }}
            >
              ›
            </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <span className="text-dark text-decoration-none fs-4 text-sm">Pajamas</span>
            <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>Featured pajamas collection</p>
          </div>
          <Link href="/products" className="btn btn-outline-white bg-black text-white rounded-0">
            Explore all
          </Link>
        </div>

        {homeLoading ? (
          <SkeletonGrid count={4} />
        ) : pajamasFeatured.length === 0 ? (
          <div className="text-center mb-4">
            <p className="text-muted">No featured pajamas products available.</p>
          </div>
        ) : (
          <div className="position-relative slider-wrapper">
            <div
              ref={pajamasRef}
              className="home-slider"
              style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '8px', scrollSnapType: 'x mandatory' }}
            >
              {pajamasFeatured.map((product) => (
                <div key={product._id || product.id} style={{ flex: '0 0 280px', width: '280px', maxWidth: '280px', scrollSnapAlign: 'center' }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            <button
                aria-label="Previous Pajamas"
                className="slider-nav-btn" // Sirf base class (Hamesha dikhegi)
                onClick={() => scrollPajamas(-1)}
                style={{ left: 8 }}
              >
                ‹
              </button>
              <button
                aria-label="Next Pajamas"
                className="slider-nav-btn" // Sirf base class (Hamesha dikhegi)
                onClick={() => scrollPajamas(1)}
                style={{ right: 8 }}
              >
                ›
              </button>
          </div>
        )}
      </div>

      {/* FAQ SECTION */}
      <div className="faq-section mt-5 pt-5">
        <div className="text-center mb-4">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <p className="faq-subtitle text-muted">Find answers to common questions about our products and services</p>
        </div>

        <div className="faq-container">
          {faqsLoading ? (
            <FAQSkeletonGrid count={5} />
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
