'use client';

import React, { Suspense } from 'react';
import Checkout from '@/components/Checkout';
import CheckoutSkeleton from '@/components/CheckoutSkeleton';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <Checkout />
    </Suspense>
  );
}
