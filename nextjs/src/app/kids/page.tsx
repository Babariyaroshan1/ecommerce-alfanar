import { Metadata } from 'next';
import { Suspense } from 'react';
import KidsProductsClient from '@/components/KidsProductsClient';

export const metadata: Metadata = {
  title: 'Kids | AL-FANAR',
  description: 'Kids products',
};

export default function KidsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KidsProductsClient />
    </Suspense>
  );
}
