'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useProductStore } from '@/store/productStore';
import '../i18n';
import Navbar from './Navbar';
import Footer from './Footer';
import Toast from './Toast';

export default function ClientWrapper({ children }) {
  const pathname = usePathname();
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const initializeLimitedProducts = useProductStore((state) => state.initializeLimitedProducts);

  useEffect(() => {
    // Load Bootstrap JS only on client side
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  useEffect(() => {
    // Initialize a limited product set on app load for faster startup
    initializeLimitedProducts?.(8);
  }, [initializeLimitedProducts]);

  useEffect(() => {
    // Check if current route is an admin route
    setIsAdminRoute(pathname?.startsWith('/admin'));
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminRoute && <Navbar />}
      <main className="flex-grow">{children}</main>
      {!isAdminRoute && <Footer />}
      <Toast />
    </div>
  );
}