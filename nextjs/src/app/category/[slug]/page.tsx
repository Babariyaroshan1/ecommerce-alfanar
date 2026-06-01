'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { SkeletonGrid } from '@/components/ProductSkeleton';
import { useProductStore } from '@/store/productStore';
import '../../../Products.css';

const slugify = (value) =>
  value?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const products = useProductStore((state) => state.products);
  const storeLoading = useProductStore((state) => state.loading);
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const initialLoad = useRef(products.length === 0);
  const skeletonStart = useRef(Date.now());
  const minSkeletonDuration = 500;
  const [loading, setLoading] = React.useState(initialLoad.current);

  React.useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, [fetchProducts, products.length]);

  React.useEffect(() => {
    if (initialLoad.current && (products.length > 0 || !storeLoading)) {
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
  }, [products.length, storeLoading]);

  const categoryProducts = products.filter((product) => slugify(product.categorySlug || product.category) === slug);
  const categoryName = categoryProducts.length > 0 ? categoryProducts[0].category : slug.replace(/-/g, ' ');

  if (loading) {
    return (
      <div className="products-container">
        <h1 className="text-center mb-4">{slug.replace(/-/g, ' ')}</h1>
        <SkeletonGrid count={12} />
      </div>
    );
  }

  return (
    <div className="products-container">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-muted mb-2">
            <Link href="/" className="text-decoration-none text-muted">Home</Link> /
            <Link href="/products" className="text-decoration-none text-muted mx-2">Products</Link> /
            <span className="text-dark">{categoryName}</span>
          </p>
          <h1 className="mb-2">{categoryName}</h1>
          <p className="text-muted mb-0">{categoryProducts.length} product{categoryProducts.length === 1 ? '' : 's'} available</p>
        </div>
      </div>

      {categoryProducts.length === 0 ? (
        <div className="text-center py-5">
          <p className="mb-3">No products were found in this category.</p>
          <Link href="/products" className="btn btn-outline-secondary">Browse all products</Link>
        </div>
      ) : (
        <div className="products-grid">
          {categoryProducts.map((product) => (
            <ProductCard key={product.id || product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
