// @ts-nocheck

'use client';

import React, { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import ProductSkeleton from '@/components/ProductSkeleton';
import { useProductStore } from '@/store/productStore';
import '../../Products.css';

export default function NewArrivalsPage() {
  const products = useProductStore((state) => state.products);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  useEffect(() => {
    setNewArrivals(products.filter((product) => product.isNew));
  }, [products]);

  if (loading) {
    return <ProductSkeleton />;
  }

  return (
    <div className="products-container">
      <h1 className="text-center mb-4">New Arrivals</h1>

      {newArrivals.length === 0 ? (
        <div className="text-center py-5">
          <h3>No new arrivals available right now.</h3>
          <p>Enable products as New Arrivals in the admin panel to show them here.</p>
        </div>
      ) : (
        <div className="products-grid">
          {newArrivals.map((product) => (
            <ProductCard key={product._id || product.id} product={product} directToProduct={true} />
          ))}
        </div>
      )}
    </div>
  );
}
