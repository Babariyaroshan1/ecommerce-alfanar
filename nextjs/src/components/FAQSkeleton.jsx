'use client';

import React from 'react';
import './FAQSkeleton.css';

export default function FAQSkeleton() {
  return (
    <div className="faq-skeleton-item">
      <div className="faq-skeleton-question">
        <div className="skeleton-text skeleton-faq-title"></div>
        <div className="skeleton-toggle"></div>
      </div>
      <div className="faq-skeleton-answer">
        <div className="skeleton-text skeleton-faq-text"></div>
        <div className="skeleton-text skeleton-faq-text short"></div>
      </div>
    </div>
  );
}

export function FAQSkeletonGrid({ count = 5 }) {
  return (
    <div className="faq-skeleton-container">
      {Array.from({ length: count }).map((_, index) => (
        <FAQSkeleton key={index} />
      ))}
    </div>
  );
}
