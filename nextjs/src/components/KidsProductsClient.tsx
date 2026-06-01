"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from './ProductCard';
import { SkeletonGrid } from './ProductSkeleton';
import { useProductStore } from '../store/productStore';
import Fuse from 'fuse.js';
import '../Products.css';

const KidsProductsClient = () => {
  const products = useProductStore((state) => state.products);
  const storeLoading = useProductStore((state) => state.loading);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const searchParams = useSearchParams();
  const initialKidsLoad = useRef(products.length === 0);
  const kidsSkeletonStart = useRef(Date.now());
  const minSkeletonDuration = 500;
  const [filteredProducts, setFilteredProducts] = useState(() => products.filter((p) => p.isKidsProduct === true));
  const [selectedKidsType, setSelectedKidsType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [fuse, setFuse] = useState(null);
  const [loading, setLoading] = useState(initialKidsLoad.current);

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, [fetchProducts, products.length]);

  useEffect(() => {
    const kidsProducts = products.filter(p => p.isKidsProduct === true);
    setFilteredProducts(kidsProducts);

    if (kidsProducts.length > 0) {
      const fuseInstance = new Fuse(kidsProducts, {
        keys: ['name', 'description'],
        threshold: 0.4,
        includeScore: true,
        includeMatches: true,
      });
      setFuse(fuseInstance);
    }

    if (initialKidsLoad.current && (kidsProducts.length > 0 || !storeLoading)) {
      const elapsed = Date.now() - kidsSkeletonStart.current;
      const timer = setTimeout(
        () => setLoading(false),
        Math.max(0, minSkeletonDuration - elapsed)
      );
      return () => clearTimeout(timer);
    }

    if (!initialKidsLoad.current) {
      setLoading(false);
    }
  }, [products, storeLoading]);

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, selectedKidsType, sortBy, searchQuery, fuse]);

  const filterAndSortProducts = () => {
    let filtered = products.filter(p => p.isKidsProduct === true);

    // Filter by kids type
    if (selectedKidsType !== 'all') {
      filtered = filtered.filter(p => p.kidsType === selectedKidsType);
    }

    if (searchQuery && fuse) {
      const searchResults = fuse.search(searchQuery);
      const searchProductIds = new Set(searchResults.map(result => result.item._id || result.item.id));
      filtered = filtered.filter((p) => searchProductIds.has(p._id || p.id));
    }

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => parseFloat(String(a.price).replace(/[^0-9.]/g, '')) - parseFloat(String(b.price).replace(/[^0-9.]/g, '')));
        break;
      case 'price-high':
        filtered.sort((a, b) => parseFloat(String(b.price).replace(/[^0-9.]/g, '')) - parseFloat(String(a.price).replace(/[^0-9.]/g, '')));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return (b.id || 0) - (a.id || 0);
        });
        break;
    }
    setFilteredProducts(filtered);
  };

  if (loading) {
    return (
      <div className="products-container">
        <h1 className="text-center mb-4">Kids Products</h1>
        <SkeletonGrid count={8} />
      </div>
    );
  }

  return (
    <div className="products-container">
      <h1 className="text-center mb-4">Kids Products</h1>
      <p className="text-center text-muted mb-4">Explore our beautiful collection of kids clothing, dresses, and accessories</p>

      <div className="filters mb-4">
        <div className="filters-left">
          <div className="filter-group">
            <label>Kids Type:</label>
            <div className="kids-type-buttons">
              <button
                className={`filter-btn ${selectedKidsType === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedKidsType('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${selectedKidsType === 'boys' ? 'active' : ''}`}
                onClick={() => setSelectedKidsType('boys')}
              >
                 Boys
              </button>
              <button
                className={`filter-btn ${selectedKidsType === 'girls' ? 'active' : ''}`}
                onClick={() => setSelectedKidsType('girls')}
              >
                Girls
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="sort-select">Sort By:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="filters-right">
          <div className="filter-group">
            <label htmlFor="search-input">Search:</label>
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search kids products..."
            />
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">No kids products found.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id || product._id} product={product} directToProduct={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default KidsProductsClient;
