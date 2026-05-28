'use client';

import React from 'react';
import './ProductSkeleton.css';

export default function ProductSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-text skeleton-title"></div>
        <div className="skeleton-text skeleton-description"></div>
        <div className="skeleton-text skeleton-description short"></div>
        <div className="skeleton-footer">
          <div className="skeleton-text skeleton-price"></div>
          <div className="skeleton-text skeleton-button"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
}
