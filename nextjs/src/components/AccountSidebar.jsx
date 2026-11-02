'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { useAuthStore } from '../store/authStore';
import './AccountSidebar.css';

const subscribeHydration = () => () => {};
const getClientHydration = () => true;
const getServerHydration = () => false;

export function useAccountHydrated() {
  return useSyncExternalStore(subscribeHydration, getClientHydration, getServerHydration);
}

export default function AccountSidebar({ active }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="account-sidebar">
      <div className="account-summary">
        <strong>{user?.name || 'My Account'}</strong>
        <span>{user?.email || ''}</span>
      </div>
      <nav className="account-navigation" aria-label="Account">
        <Link className={active === 'profile' ? 'active' : ''} href="/profile">My Profile</Link>
        <Link className={active === 'orders' ? 'active' : ''} href="/orders">
          <span>Orders</span><small>Track and manage your orders</small>
        </Link>
        <Link className={active === 'addresses' ? 'active' : ''} href="/profile/addresses">Saved Address</Link>
      </nav>
      <button className="account-logout" type="button" onClick={handleLogout}>LOGOUT</button>
    </aside>
  );
}
