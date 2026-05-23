'use client';

import React from 'react';
import './BannerSkeleton.css';

export default function BannerSkeleton() {
  return (
    <div className="banner-skeleton-container mb-5">
      <div className="banner-skeleton-image">
        <div className="skeleton-shimmer"></div>
      </div>
    </div>
  );
}
