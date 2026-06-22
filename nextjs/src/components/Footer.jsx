'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import './Footer.css';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="footer-container">
      {/* Main Footer Content */}
      <div className="footer-main">
        <div className="footer-wrapper">
          {/* Left Side - Newsletter Section */}
          <div className="footer-section footer-left">
            <div className="newsletter-section">
              <h3 className="footer-section-title">Let's get in touch</h3>
              <p className="footer-section-desc">
                Subscribe now and get 10% off your first order
              </p>
              <form className="newsletter-form" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  className="newsletter-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="subscribe-btn">
                  Subscribe now
                </button>
              </form>
            </div>
          </div>

          {/* Right Side - All Other Sections */}
          <div className="footer-right">
            {/* Explore Section */}
            <div className="footer-section footer-column">
              <h4 className="footer-column-title">EXPLORE</h4>
              <ul className="footer-column-links">
                <li><Link href="/">About Us</Link></li>
                <li><Link href="/">Store Locations</Link></li>
                <li><Link href="/products">Search</Link></li>
                <li><Link href="/blog"> Blog </Link></li>
              </ul>
            </div>

            {/* About Section */}
            <div className="footer-section footer-column">
              <h4 className="footer-column-title">ABOUT</h4>
              <ul className="footer-column-links">
                <li><Link href="/">Shipping & Delivery</Link></li>
                <li><Link href="/">Return & Exchange</Link></li>
                <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
              </ul>
            </div>

            {/* Contact Section */}
            <div className="footer-section footer-column">
              <h4 className="footer-column-title">CONTACT</h4>
              <div className="contact-section">
                <p className="contact-phone">+965 97210352</p>
                <p className="contact-hours">Saturday - Wednesday: 10am to 10pm</p>
                <p className="contact-hours">Thursday & Friday: 10am to 11pm</p>
              </div>
              <div className="social-icons-footer">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://snapchat.com" target="_blank" rel="noopener noreferrer" aria-label="Snapchat">
                  <i className="fab fa-snapchat"></i>
                </a>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                  <i className="fab fa-tiktok"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p className="copyright-text">Powered By Chai and Chill  © 2026 All Rights Reserved.</p>
          <Link href="/orders" className="orders-link">Orders</Link>
        </div>
      </div>
    </footer>
  );
}
