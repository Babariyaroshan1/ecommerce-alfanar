'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from './ProductCard';
import { useProductStore } from '../store/productStore';
import Fuse from 'fuse.js';
import '../Products.css';

const ProductsClient = () => {
  const products = useProductStore((state) => state.products);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const searchParams = useSearchParams();
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [fuse, setFuse] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, selectedCategory, sortBy, searchQuery, fuse]);

  const filterAndSortProducts = () => {
    let filtered = selectedCategory === 'all'
      ? [...products].filter(p => p.isKidsProduct !== true)
      : products.filter((p) => p.category === selectedCategory && p.isKidsProduct !== true);

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
            return +new Date(b.createdAt) - +new Date(a.createdAt);
          }
          return (b.id || 0) - (a.id || 0);
        });
        break;
    }
    setFilteredProducts(filtered);
  };

  const categories = ['all', ...Array.from(new Set(products.filter(p => p.isKidsProduct !== true).map((product: any) => product.category).filter(Boolean))) as string[]];

  return (
    <div className="products-container">
      <h1 className="text-center mb-4">Our Products</h1>

      <div className="filters mb-4">
        <div className="filters-left">
          <div className="filter-group">
            <label htmlFor="category-select">Category:</label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
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
              placeholder="Search products..."
            />
          </div>
        </div>
      </div>
      <div className="products-grid">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id || product._id} product={product} directToProduct={true} />
        ))}
      </div>
    </div>
  );
};

export default ProductsClient;
