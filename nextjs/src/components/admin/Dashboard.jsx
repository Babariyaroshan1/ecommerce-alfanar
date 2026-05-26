import React, { useEffect, useState } from 'react';
import axios from 'axios';
import OrderList from './OrderList';
import ProductList from './ProductList';
import AddProduct from './AddProduct';
import AddKidsProducts from './AddKidsProducts';
import UserList from './UserList';
import CurrencyManagement from './CurrencyManagement';
import PermissionManagement from './PermissionManagement';
import FAQManagement from './FAQManagement';
import ProductFAQManagement from './ProductFAQManagement';
import ProductReviewsManagement from './ProductReviewsManagement';
import Analytics from './Analytics';
import Coupons from './Coupons';
import BannerSettings from './BannerSettings';
import ChangeCoadminPassword from './ChangeCoadminPassword';
import ChangeAdminPassword from './ChangeAdminPassword';
import ChangeCoadminUsername from './ChangeCoadminUsername';
import { useProductStore } from '../../store/productStore';
import './Dashboard.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production

const parseTokenRole = (token) => {
  if (!token) return 'admin';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || 'admin';
  } catch {
    return 'admin';
  }
};

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    cancelledOrders: 0,
    pendingRequests: 0
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [role, setRole] = useState('admin');
  const [permissions, setPermissions] = useState([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  useEffect(() => {
    setRole(parseTokenRole(token));
    fetchStats();
    fetchUserProfile();
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPermissions(response.data.permissions || []);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Helper function to check if user has a specific permission
  const hasPermission = (permissionKey) => {
    // Admin has all permissions
    if (role === 'admin') return true;
    // Coadmin needs to have the permission in their list
    return permissions.includes(permissionKey);
  };

  const fetchStats = async () => {
    try {
      const ordersRes = await axios.get(`${API_URL}/orders/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const productsRes = await axios.get(`${API_URL}/products`);

      // Sum item-level amounts (price * quantity) for orders that are paid or delivered
      const totalRevenue = ordersRes.data
        .filter(order => order.paymentStatus === 'paid' || order.orderStatus === 'delivered')
        .reduce((sum, order) => {
          const itemsSum = (order.items || []).reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
          return sum + itemsSum;
        }, 0);

      // Count pending return/replacement requests
      const pendingRequests = ordersRes.data.filter(order => {
        const returnStatus = order.returnRequest?.status;
        const replacementStatus = order.replacementRequest?.status;
        return (returnStatus && returnStatus === 'pending') || (replacementStatus && replacementStatus === 'pending');
      }).length;

      const cancelledOrders = ordersRes.data.filter(order => order.orderStatus === 'cancelled').length;

      setStats({
        totalOrders: ordersRes.data.length,
        totalProducts: productsRes.data.total || productsRes.data.products.length,
        totalRevenue,
        cancelledOrders,
        pendingRequests
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-tachometer-alt', permission: null },
    { id: 'analytics', label: 'Analytics', icon: 'fa-solid fa-chart-line', permission: 'view_analytics' },
    { id: 'orders', label: 'Orders', icon: 'fa-solid fa-shopping-cart', permission: 'manage_orders' },
    { id: 'products', label: 'Products', icon: 'fa-solid fa-box', permission: 'manage_products' },
    { id: 'requests', label: 'Ret/rep', icon: 'fa-solid fa-undo', badge: stats.pendingRequests, permission: 'manage_orders' },
    { id: 'users', label: 'Users', icon: 'fa-solid fa-users', permission: 'manage_users' },
    { id: 'add-product', label: 'Add Product', icon: 'fa-solid fa-plus', permission: 'manage_products' },
    { id: 'add-kids-product', label: 'Add Kids', icon: 'fa-solid fa-child', permission: 'manage_kids_products' },
    { id: 'faqs', label: 'FAQs', icon: 'fa-solid fa-question-circle', permission: 'manage_faqs' },
    { id: 'product-faqs', label: 'Product FAQs', icon: 'fa-solid fa-question-circle', permission: 'manage_product_faqs' },
    { id: 'reviews', label: 'Reviews', icon: 'fa-solid fa-star', permission: 'manage_reviews' },
    { id: 'currency', label: 'Currency', icon: 'fa-solid fa-dollar-sign', permission: 'manage_currency' },
    { id: 'banner', label: 'Banner', icon: 'fa-solid fa-image', permission: 'manage_banner' },
    { id: 'coupons', label: 'Coupons', icon: 'fa-solid fa-tags', permission: 'manage_coupons' },
    { id: 'permissions', label: 'Permissions', icon: 'fa-solid fa-shield-alt', permission: 'manage_settings', adminOnly: true },
    { id: 'change-admin-password', label: 'Admin Pass', icon: 'fa-solid fa-key', permission: 'manage_settings', adminOnly: true },
    { id: 'change-coadmin-password', label: 'Coadmin Pass', icon: 'fa-solid fa-key', permission: 'manage_settings', adminOnly: true },
    { id: 'change-coadmin-username', label: 'Coadmin User', icon: 'fa-solid fa-user-edit', permission: 'manage_settings', adminOnly: true }
  ].filter(item => {
    // Always show dashboard
    if (item.permission === null) return true;
    // Admin-only items
    if (item.adminOnly && role !== 'admin') return false;
    // Permission-based items
    return hasPermission(item.permission);
  });      

  return (
    <div className="dashboard-wrapper">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <span className="hamburger"></span>
            </button>
            <div>
              <h1 className="header-title">Admin Control Panel</h1>
              <p className="role-label">Role: {role === 'admin' ? 'Admin' : 'Co-Admin'}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  // Close sidebar on mobile after clicking
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                title={item.label}
              >
                <i className={`nav-icon ${item.icon}`} aria-hidden="true"></i>
                <span className="nav-label">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="badge-notification">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-main">
              <h2 className="page-title">Dashboard Overview</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <h3 className="stat-title">Total Orders</h3>
                  </div>
                  <p className="stat-value">{stats.totalOrders}</p>
                  <p className="stat-label">orders placed</p>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <h3 className="stat-title">Total Products</h3>
                  </div>
                  <p className="stat-value">{stats.totalProducts}</p>
                  <p className="stat-label">products listed</p>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <h3 className="stat-title">Cancelled Orders</h3>
                  </div>
                  <p className="stat-value">{stats.cancelledOrders}</p>
                  <p className="stat-label">orders cancelled</p>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <h3 className="stat-title">Total Revenue</h3>
                  </div>
                  <p className="stat-value">KWD {Number(stats.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</p>
                  <p className="stat-label">total earned (KWD)</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && hasPermission('view_analytics') && <Analytics />}
          {activeTab === 'orders' && <OrderList />}
          {activeTab === 'requests' && <OrderList showOnlyRequests={true} />}
          {activeTab === 'products' && <ProductList />}
          {activeTab === 'users' && <UserList />}
          {activeTab === 'add-product' && <AddProduct />}
          {activeTab === 'add-kids-product' && <AddKidsProducts />}
          {activeTab === 'faqs' && <FAQManagement />}
          {activeTab === 'product-faqs' && <ProductFAQManagement />}
          {activeTab === 'reviews' && <ProductReviewsManagement />}
          {activeTab === 'currency' && <CurrencyManagement />}
          {activeTab === 'banner' && <BannerSettings />}
          {activeTab === 'coupons' && <Coupons />}
          {activeTab === 'permissions' && role === 'admin' && <PermissionManagement />}
          {activeTab === 'change-admin-password' && role === 'admin' && <ChangeAdminPassword />}
          {activeTab === 'change-coadmin-password' && role === 'admin' && <ChangeCoadminPassword />}
          {activeTab === 'change-coadmin-username' && role === 'admin' && <ChangeCoadminUsername />}
        </main>
      </div>
    </div>
  );
}