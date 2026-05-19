"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from './ProductCard';
import { useProductStore } from '../store/productStore';
import Fuse from 'fuse.js';
import '../Products.css';

const KidsProductsClient = () => {
  const products = useProductStore((state) => state.products);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const searchParams = useSearchParams();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [fuse, setFuse] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const kidsProducts = products.filter(p => p.category && p.category.toLowerCase() === 'kids');

    if (kidsProducts.length > 0) {
      const fuseInstance = new Fuse(kidsProducts, {
        keys: ['name', 'description'],
        threshold: 0.4,
        includeScore: true,
        includeMatches: true,
      });
      setFuse(fuseInstance);
    }
  }, [products]);

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, sortBy, searchQuery, fuse]);

  const filterAndSortProducts = () => {
    let filtered = products.filter(p => p.category && p.category.toLowerCase() === 'kids');

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

  return (
    <div className="products-container">
      <h1 className="text-center mb-4">Kids Products</h1>
      <p className="text-center text-muted mb-4">Explore our beautiful collection of kids clothing, dresses, and accessories</p>

      <div className="filters mb-4">
        <div className="filters-left">
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
