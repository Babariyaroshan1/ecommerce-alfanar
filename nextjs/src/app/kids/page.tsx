import { Metadata } from 'next';
import { Suspense } from 'react';
import KidsProductsClient from '@/components/KidsProductsClient';
import ProductSkeleton from '@/components/ProductSkeleton';

export const metadata: Metadata = {
  title: 'Kids | AL-FANAR',
  description: 'Kids products',
};

export default function KidsPage() {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <KidsProductsClient />
    </Suspense>
  );
}
