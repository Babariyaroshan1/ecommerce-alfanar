'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import AddKidsProducts from '../../../components/admin/AddKidsProducts';

export default function AddKidsProductsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // Check if user is admin
    if (!user?.isAdmin) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user?.isAdmin) {
    return null;
  }

  return <AddKidsProducts />;
}
