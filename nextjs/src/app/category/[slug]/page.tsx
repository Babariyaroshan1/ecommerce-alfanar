'use client';

import React from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { useProductStore } from '@/store/productStore';
import '../../../Products.css';

const slugify = (value) =>
  value?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '';

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const products = useProductStore((state) => state.products);
  const fetchProducts = useProductStore((state) => state.fetchProducts);

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const categoryProducts = products.filter((product) => slugify(product.categorySlug || product.category) === slug);
  const categoryName = categoryProducts.length > 0 ? categoryProducts[0].category : slug.replace(/-/g, ' ');

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
