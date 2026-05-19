import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { useProductStore } from '../store/productStore';
import { useTranslation } from 'react-i18next';
import Fuse from 'fuse.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { cart } = useCartStore();
  const { favorites } = useFavoritesStore();
  const {
    products,
    initializeProducts,
    currencySettings,
    selectedCurrency,
    setSelectedCurrency,
  } = useProductStore();

  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fuse, setFuse] = useState(null);

  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    initializeProducts();
  }, [initializeProducts]);

  useEffect(() => {
    if (mounted && !currencySettings?.showKwdNavbarOption) {
      setSelectedCurrency('KWD');
    }
  }, [mounted, currencySettings?.showKwdNavbarOption, setSelectedCurrency]);

  useEffect(() => {
    if (products.length > 0) {
      const fuseInstance = new Fuse(products, {
        keys: ['name', 'description'],
        threshold: 0.4,
        includeScore: true,
        includeMatches: true,
      });
      setFuse(fuseInstance);
    }
  }, [products]);

  useEffect(() => {
    if (searchQuery.length > 1 && fuse) {
      const results = fuse.search(searchQuery).slice(0, 5);
      setSearchSuggestions(results.map((result) => result.item));
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, fuse]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
    if (mobileProductsOpen) setMobileProductsOpen(false);
  };

  const handleProductToggle = (e) => {
    e.preventDefault();
    setMobileProductsOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileProductsOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const query = searchQuery.trim();

    if (query) {
      const exactMatch = products.find(
        (product) => product.name.toLowerCase() === query.toLowerCase()
      );

      if (exactMatch) {
        const productId = exactMatch._id || exactMatch.id;
        router.push(`/product/${productId}`);
      } else {
        router.push(`/products?search=${encodeURIComponent(query)}`);
      }

      setShowSuggestions(false);
      setSearchQuery('');
    }
  };

  const handleSuggestionClick = (product) => {
    const productId = product._id || product.id;
    router.push(`/product/${productId}`);
    setShowSuggestions(false);
    setSearchQuery('');
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = lng;
  };

  const changeCurrency = (currency) => {
    setSelectedCurrency(currency);
  };

  const ProfileIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const OrdersIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );

  const AddressIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );

  return (
    <nav className="custom-navbar bg-white border-bottom sticky-top py-3">
      <div className="container-fluid px-4">
        <div className="d-flex align-items-center justify-content-between">

          <button
            className="navbar-toggler d-lg-none border-0 bg-transparent p-0 me-2"
            type="button"
            onClick={toggleMobileMenu}
            aria-controls="navbarNav"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="d-lg-none">
            <Link href="/" className="text-decoration-none">
              <span className="brand-logo-text-mobile">AL-FANAR</span>
            </Link>
          </div>

          <div className="d-none d-lg-flex align-items-center gap-4">
            <Link href="/" className="nav-link-custom fw-semibold text-dark">
              {t('Home')}
            </Link>

            <Link className="nav-link-custom text-dark" href="/kids">
              Kids
            </Link>

            <div className="nav-item dropdown">
              <Link
                href="/products"
                className="nav-link-custom text-dark d-flex align-items-center gap-1"
                data-bs-toggle="dropdown"
              >
                {t('Products')}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </Link>

              <ul className="dropdown-menu shadow-sm border-0">
                <li>
                  <Link className="dropdown-item" href="/products">
                    {t('All Products')}
                  </Link>
                </li>
              </ul>
            </div>

            {currencySettings?.showNewArrivalsNavbar && (
              <Link href="/new-arrivals" className="nav-link-custom text-dark">
                {t('New Arrivals')}
              </Link>
            )}
          </div>

          <div className="nav-center position-absolute start-50 translate-middle-x d-none d-lg-block">
            <Link href="/" className="text-decoration-none">
              <span className="brand-logo-text">AL-FANAR</span>
            </Link>
          </div>

          <div
            className={`mobile-menu d-lg-none ${mobileMenuOpen ? 'open' : ''}`}
            id="navbarNav"
          >
            <div className="mobile-menu-inner">
              <Link href="/" className="nav-link-custom fw-semibold text-dark" onClick={closeMobileMenu}>
                {t('Home')}
              </Link>
            <Link className="nav-link-custom text-dark d-flex align-items-center gap-1 btn p-0 text-start" href="/products" onClick={closeMobileMenu}>
                {t('All Products')}
              </Link>
                 <Link href="/kids" className="nav-link-custom text-dark p-0 " onClick={closeMobileMenu}>
                Kids 
              </Link>

              {mounted && user && (
                <Link href="/orders" className="nav-link-custom text-dark mobile-only-order p-0" onClick={closeMobileMenu}>
                  {/* <OrdersIcon /> */}
                  {t('Orders')}
                </Link>
              )}

              {/* <div className="nav-item"> */}
                {/* <button
                  type="button"
                  className="nav-link-custom text-dark d-flex align-items-center gap-1 btn p-0 text-start"
                  onClick={handleProductToggle}
                  aria-expanded={mobileProductsOpen}
                >
                  {t('Products')}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                <ul className={`mobile-submenu shadow-sm border-0${mobileProductsOpen ? ' open' : ''}`}>
                  <li>
                    <Link className="dropdown-item" href="/products" onClick={closeMobileMenu}>
                      {t('All Products')}
                    </Link>
                  </li>
                </ul> */}
                {/* <Link className="nav-link-custom text-dark d-flex align-items-center gap-1 btn p-0 text-start" href="/products" onClick={closeMobileMenu}>
                      {t('All Products')}
                    </Link> */}
              {/* </div> */}

           

              {currencySettings?.showNewArrivalsNavbar && (
                <Link href="/new-arrivals" className="nav-link-custom text-dark" onClick={closeMobileMenu}>
                  {t('New Arrivals')}
                </Link>
              )}
            </div>
          </div>

          <div className="nav-right d-flex align-items-center gap-2 gap-lg-3">
            <div className="dropdown d-none d-md-block">
              <button className="lang-box d-flex align-items-center gap-1 px-2 py-1 rounded bg-light cursor-pointer border-0" data-bs-toggle="dropdown">
                <span className="text-sm">
                  {i18n.language === 'ar' ? t('Arabic') : t('English')}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              <ul className="dropdown-menu shadow-sm border-0">
                <li>
                  <button className="dropdown-item" onClick={() => changeLanguage('en')}>
                    {t('English')}
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={() => changeLanguage('ar')}>
                    {t('Arabic')}
                  </button>
                </li>
              </ul>
            </div>

            {mounted && currencySettings?.showKwdNavbarOption && (
              <div className="dropdown d-none d-md-block">
                <button className="lang-box d-flex align-items-center gap-2 px-2 py-1 rounded bg-light cursor-pointer border-0" data-bs-toggle="dropdown">
                  <img
                    src={selectedCurrency === 'KWD' ? '/kwd-flag.png' : '/Flag_of_India.svg.png'}
                    alt={selectedCurrency}
                    style={{ width: '24px', height: '16px', borderRadius: '2px' }}
                  />
                  <span className="text-sm fw-medium">{selectedCurrency}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                <ul className="dropdown-menu shadow-sm border-0">
                  <li>
                    <button
                      className={`dropdown-item d-flex align-items-center gap-2 ${selectedCurrency === 'KWD' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        changeCurrency('KWD');
                      }}
                    >
                      <img src="/kwd-flag.png" alt="Kuwait" style={{ width: '20px', height: '14px', borderRadius: '2px' }} />
                      KWD - Kuwait
                    </button>
                  </li>

                  <li>
                    <button
                      className={`dropdown-item d-flex align-items-center gap-2 ${selectedCurrency === 'INR' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        changeCurrency('INR');
                      }}
                    >
                      <img src="/Flag_of_India.svg.png" alt="India" style={{ width: '20px', height: '14px', borderRadius: '2px' }} />
                      INR - India
                    </button>
                  </li>
                </ul>
              </div>
            )}

            {currencySettings?.showKwdNavbarOption && (
              <div className="vr mx-2 text-muted d-none d-md-block"></div>
            )}

            <div className="search-container d-none d-md-block position-relative" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="d-flex">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input form-control"
                  placeholder={t('Search products...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
                />

                <button
                  type="submit"
                  className="search-btn btn btn-outline-secondary ms-1"
                  onClick={(e) => {
                    if (!searchQuery.trim()) {
                      e.preventDefault();
                      searchInputRef.current?.focus();
                    }
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </button>
              </form>

              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="search-suggestions position-absolute bg-white border rounded shadow-sm mt-1" style={{ width: '300px', zIndex: 1050 }}>
                  {searchSuggestions.map((product) => (
                    <div
                      key={product._id || product.id}
                      className="suggestion-item px-3 py-2 cursor-pointer hover-bg-light"
                      onClick={() => handleSuggestionClick(product)}
                    >
                      <div className="d-flex align-items-center">
                        {product.images && product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="me-2"
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        )}

                        <div>
                          <div className="fw-semibold text-truncate" style={{ maxWidth: '200px' }}>
                            {product.name}
                          </div>
                          <div className="text-muted small">
                            {product.price} {product.currency || 'KWD'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {searchSuggestions.length >= 5 && (
                    <div className="px-3 py-2 border-top">
                      <button className="btn btn-link p-0 text-decoration-none w-100 text-start" onClick={handleSearchSubmit}>
                        {t('View all results')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="dropdown">
              <button className="icon-btn" data-bs-toggle="dropdown">
                <ProfileIcon />
              </button>

              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                {!mounted ? (
                  <>
                    <li>
                      <Link className="dropdown-item" href="/login">{t('Login')}</Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="/register">{t('Register')}</Link>
                    </li>
                  </>
                ) : user ? (
                  <>
                    <li>
                      <Link className="dropdown-item d-flex align-items-center gap-2" href="/profile">
                        <ProfileIcon />
                        {t('Profile')}
                      </Link>
                    </li>

                    <li>
                      <Link className="dropdown-item d-flex align-items-center gap-2" href="/orders">
                        <OrdersIcon />
                        {t('Orders')}
                      </Link>
                    </li>

                    <li>
                      <Link className="dropdown-item d-flex align-items-center gap-2" href="/addresses">
                        <AddressIcon />
                        {t('Add Address')}
                      </Link>
                    </li>

                    <li><hr className="dropdown-divider" /></li>

                    <li>
                      <button className="dropdown-item text-danger" onClick={handleLogout}>
                        {t('Logout')}
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link className="dropdown-item" href="/login">{t('Login')}</Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" href="/register">{t('Register')}</Link>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <Link href="/wishlist" className="icon-btn position-relative">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>

              {mounted && favorites.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark">
                  {favorites.length}
                </span>
              )}
            </Link>

            <Link href="/cart" className="icon-btn position-relative ms-1">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>

              {mounted && cart.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark">
                  {cart.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}