'use client';

import { useEffect, useState } from 'react';
import Login from '@/components/admin/Login';
import Dashboard from '@/components/admin/Dashboard';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setAuthenticated(Boolean(localStorage.getItem('adminToken')));
    }
  }, []);

  if (!isMounted) {
    return <div className="min-h-screen flex items-center justify-center">Loading admin...</div>;
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
    }
    setAuthenticated(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {authenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={() => setAuthenticated(true)} />
      )}
    </main>
  );
}
