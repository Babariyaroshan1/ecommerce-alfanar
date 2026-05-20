import { Metadata } from 'next';
import { Suspense } from 'react';
import ProductsClient from '@/components/ProductsClient';

export const metadata: Metadata = {
  title: 'Products | AL-FANAR',
  description: 'Browse all products',
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading products...</div>}>
      <ProductsClient />
    </Suspense>
  );
}
