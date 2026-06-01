// @ts-nocheck

'use client';

import React, { useEffect, useState, useRef } from 'react';
import ProductCard from '@/components/ProductCard';
import { SkeletonGrid } from '@/components/ProductSkeleton';
import { useProductStore } from '@/store/productStore';
import '../../Products.css';

export default function NewArrivalsPage() {
  const products = useProductStore((state) => state.products);
  const storeLoading = useProductStore((state) => state.loading);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const initialLoad = useRef(products.length === 0);
  const skeletonStart = useRef(Date.now());
  const minSkeletonDuration = 500;
  const [newArrivals, setNewArrivals] = useState(() => products.filter((product) => product.isNew));
  const [loading, setLoading] = useState(initialLoad.current);

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, [fetchProducts, products.length]);

  useEffect(() => {
    const newArrivalsData = products.filter((product) => product.isNew);
    setNewArrivals(newArrivalsData);

    if (initialLoad.current && (newArrivalsData.length > 0 || !storeLoading)) {
      const elapsed = Date.now() - skeletonStart.current;
      const timer = setTimeout(
        () => setLoading(false),
        Math.max(0, minSkeletonDuration - elapsed)
      );
      return () => clearTimeout(timer);
    }

    if (!initialLoad.current) {
      setLoading(false);
    }
  }, [products, storeLoading]);

  if (loading) {
    return (
      <div className="products-container">
        <h1 className="text-center mb-4">New Arrivals</h1>
        <SkeletonGrid count={12} />
      </div>
    );
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
