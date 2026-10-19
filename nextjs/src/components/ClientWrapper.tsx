'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useProductStore } from '@/store/productStore';
import '../i18n';
import Navbar from './Navbar';
import Footer from './Footer';
import Toast from './Toast';

export default function ClientWrapper({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin') ?? false;
  const initializeLimitedProducts = useProductStore((state) => state.initializeLimitedProducts);

  useEffect(() => {
    // Load Bootstrap JS only on client side
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  useEffect(() => {
    // Initialize a limited product set on app load for faster startup
    initializeLimitedProducts?.(8);
  }, [initializeLimitedProducts]);

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminRoute && <Navbar />}
      <main className="flex-grow">{children}</main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && (
        <a
          className="whatsapp-float"
          href="https://wa.me/96597210352?text=Hello%2C%20I%20need%20help%20with%20my%20order."
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          title="Chat with us on WhatsApp"
        >
          <i className="fa-brands fa-whatsapp" aria-hidden="true" />
        </a>
      )}
      <Toast />
    </div>
  );
}