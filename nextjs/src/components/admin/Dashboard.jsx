import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
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
import PaymentMethodsManagement from './PaymentMethodsManagement';
import ChangeAdminPassword from './ChangeAdminPassword';
import CoadminManagement from './CoadminManagement';
import AdminHistory from './AdminHistory';
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
  const [permissions, setPermissions] = useState([]);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';

    const savedTheme = localStorage.getItem('admin-theme');
    if (savedTheme) return savedTheme;

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const role = parseTokenRole(token);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPermissions(response.data.permissions || []);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
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

      // Count pending return/replacement requests only when a real request exists
      const pendingRequests = ordersRes.data.filter(order => {
        const returnRequestPending = order.returnRequest?.requestedAt && String(order.returnRequest?.status).toLowerCase() === 'pending';
        const replacementRequestPending = order.replacementRequest?.requestedAt && String(order.replacementRequest?.status).toLowerCase() === 'pending';
        return returnRequestPending || replacementRequestPending;
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
  }, [token]);

  const hasPermission = (permissionKey) => {
    if (role === 'admin') return true;
    if (permissions.includes(permissionKey)) return true;
    if (permissionKey === 'view_products' || permissionKey === 'add_products') {
      return permissions.includes('manage_products');
    }
    if (permissionKey === 'manage_orders' && permissions.includes('manage_orders')) return true;
    return false;
  };

  useEffect(() => {
    if (!token) return;

    const loadAdminData = () => {
      fetchStats();
      fetchUserProfile();
    };

    loadAdminData();
  }, [fetchStats, fetchUserProfile, token]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    localStorage.setItem('admin-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-tachometer-alt', permission: null },
    { id: 'analytics', label: 'Analytics', icon: 'fa-solid fa-chart-line', permission: 'view_analytics' },
    { id: 'orders', label: 'Orders', icon: 'fa-solid fa-shopping-cart', permission: 'manage_orders' },
    { id: 'products', label: 'Products', icon: 'fa-solid fa-box', permission: 'view_products' },
    { id: 'requests', label: 'Ret/rep', icon: 'fa-solid fa-undo', badge: stats.pendingRequests, permission: 'manage_orders' },
    { id: 'users', label: 'Users', icon: 'fa-solid fa-users', permission: 'manage_users' },
    { id: 'add-product', label: 'Add Product', icon: 'fa-solid fa-plus', permission: 'add_products' },
    { id: 'add-kids-product', label: 'Add Kids', icon: 'fa-solid fa-child', permission: 'manage_kids_products' },
    { id: 'faqs', label: 'FAQs', icon: 'fa-solid fa-question-circle', permission: 'manage_faqs' },
    { id: 'product-faqs', label: 'Product FAQs', icon: 'fa-solid fa-question-circle', permission: 'manage_product_faqs' },
    { id: 'reviews', label: 'Reviews', icon: 'fa-solid fa-star', permission: 'manage_reviews' },
    { id: 'currency', label: 'Currency', icon: 'fa-solid fa-dollar-sign', permission: 'manage_currency' },
    { id: 'banner', label: 'Banner', icon: 'fa-solid fa-image', permission: 'manage_banner' },
    { id: 'payment-methods', label: 'Payment', icon: 'fa-solid fa-credit-card', permission: 'manage_settings', adminOnly: true },
    { id: 'history', label: 'History', icon: 'fa-solid fa-history', permission: 'manage_settings', adminOnly: true },
    { id: 'coupons', label: 'Coupons', icon: 'fa-solid fa-tags', permission: 'manage_coupons' },
    { id: 'permissions', label: 'Permissions', icon: 'fa-solid fa-shield-alt', permission: 'manage_settings', adminOnly: true },
    { id: 'change-admin-password', label: 'Admin Pass', icon: 'fa-solid fa-key', permission: 'manage_settings', adminOnly: true },
    { id: 'coadmin-management', label: 'Coadmin Mgmt', icon: 'fa-solid fa-user-shield', permission: 'manage_settings', adminOnly: true }
  ].filter(item => {
    if (item.permission === null) return true;
    if (item.adminOnly && role !== 'admin') return false;
    return hasPermission(item.permission);
  });

  const menuSections = [
    {
      title: 'Reports',
      items: menuItems.filter(item => ['dashboard', 'analytics'].includes(item.id))
    },
    {
      title: 'Management',
      items: menuItems.filter(item => ['orders', 'products', 'requests', 'users', 'add-product', 'add-kids-product'].includes(item.id))
    },
    {
      title: 'Marketing',
      items: menuItems.filter(item => ['faqs', 'product-faqs', 'reviews', 'banner', 'coupons'].includes(item.id))
    },
    {
      title: 'Configuration',
      items: menuItems.filter(item => ['currency', 'payment-methods'].includes(item.id))
    },
    {
      title: 'Admin Tools',
      items: menuItems.filter(item => ['history', 'permissions', 'change-admin-password', 'coadmin-management'].includes(item.id))
    }
  ].filter(section => section.items.length > 0);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="dashboard-wrapper">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <span className="hamburger"></span>
            </button>
            <div className="header-badge">
              <p className="header-eyebrow">Operations</p>
              <h1 className="header-title">Alfanar Admin</h1>
              {/* <p className="role-label">{role === 'admin' ? 'Admin workspace' : 'Co-admin workspace'} • Live operations</p> */}
            </div>
          </div>
          <div className="header-actions">
            <div className="header-chip">
              <i className="fa-solid fa-calendar-days"></i>
              <span>Today</span>
            </div>
            <button className="header-action-btn" type="button" aria-label="Notifications">
              <i className="fa-regular fa-bell"></i>
            </button>
            <div className="profile-pill">
              <i className="fa-solid fa-user-circle"></i>
              <span>{role === 'admin' ? 'Admin' : 'Co-Admin'}</span>
            </div>
            <button className="logout-btn" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-menu-scroll">
            <nav className="sidebar-nav">
              {menuSections.map((section) => (
                <div key={section.title} className="sidebar-section">
                  {sidebarOpen && <p className="sidebar-section-title">{section.title}</p>}
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }}
                      className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                      title={item.label}
                    >
                      <i className={`nav-icon ${item.icon}`} aria-hidden="true"></i>
                      {sidebarOpen && <span className="nav-label">{item.label}</span>}
                      {item.badge > 0 && sidebarOpen && (
                        <span className="badge-notification">{item.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </div>

          <div className="sidebar-footer">
            <div className="sidebar-footer-actions">
              <button className="collapse-btn" onClick={() => setSidebarOpen((prev) => !prev)} type="button" aria-label="Toggle sidebar">
                <i className={`fa-solid ${sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
                {sidebarOpen && <span className="collapse-label">Collapse</span>}
              </button>
            </div>
            <button
              className="profile-dropdown-toggle"
              type="button"
              aria-haspopup="true"
              aria-expanded={profileMenuOpen}
              onClick={() => setProfileMenuOpen((prev) => !prev)}
            >
              <div className="profile-avatar">A</div>
              {sidebarOpen && (
                <div className="profile-meta">
                  <span className="profile-name">{role === 'admin' ? 'Admin' : 'Co-Admin'}</span>
                  <span className="profile-role">{role === 'admin' ? 'Administrator' : 'Operations'}</span>
                  <span className="profile-version">v1.0.0</span>
                </div>
              )}
              {sidebarOpen && <i className={`fa-solid ${profileMenuOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>}
            </button>

            {sidebarOpen && profileMenuOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <p className="profile-dropdown-title">Appearance</p>
                  <p className="profile-dropdown-subtitle">Toggle light / dark mode</p>
                </div>
                <hr />
                <button type="button" className="profile-dropdown-action" onClick={toggleTheme}>
                  <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} aria-hidden="true"></i>
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-main">
              <div className="page-header-card">
                <div>
                  <p className="section-eyebrow">Dashboard</p>
                  <h2 className="page-title">Operations overview</h2>
                  <p className="page-subtitle">Monitor orders, products, and admin activity from one streamlined view.</p>
                </div>
                <div className="page-header-pill">
                  <i className="fa-solid fa-sparkles"></i>
                  <span>Live update</span>
                </div>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <h3 className="stat-title">Total Orders</h3>
                    <i className="fa-solid fa-shopping-bag"></i>
                  </div>
                  <p className="stat-value">{stats.totalOrders}</p>
                  <p className="stat-label">orders placed</p>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <h3 className="stat-title">Total Products</h3>
                    <i className="fa-solid fa-box-open"></i>
                  </div>
                  <p className="stat-value">{stats.totalProducts}</p>
                  <p className="stat-label">products listed</p>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <h3 className="stat-title">Cancelled Orders</h3>
                    <i className="fa-solid fa-circle-xmark"></i>
                  </div>
                  <p className="stat-value">{stats.cancelledOrders}</p>
                  <p className="stat-label">orders cancelled</p>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <h3 className="stat-title">Total Revenue</h3>
                    <i className="fa-solid fa-chart-pie"></i>
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
          {activeTab === 'products' && <ProductList role={role} permissions={permissions} />}
          {activeTab === 'users' && <UserList />}
          {activeTab === 'add-product' && <AddProduct />} 
          {activeTab === 'add-kids-product' && <AddKidsProducts />}
          {activeTab === 'faqs' && <FAQManagement />}
          {activeTab === 'product-faqs' && <ProductFAQManagement />}
          {activeTab === 'reviews' && <ProductReviewsManagement />}
          {activeTab === 'currency' && <CurrencyManagement />}
          {activeTab === 'banner' && <BannerSettings />}
          {activeTab === 'payment-methods' && role === 'admin' && <PaymentMethodsManagement />}
          {activeTab === 'coupons' && <Coupons />}
          {activeTab === 'history' && role === 'admin' && <AdminHistory />}
          {activeTab === 'permissions' && role === 'admin' && <PermissionManagement />}
          {activeTab === 'change-admin-password' && role === 'admin' && <ChangeAdminPassword />}
          {activeTab === 'coadmin-management' && role === 'admin' && <CoadminManagement />}
        </main>
      </div>
    </div>
  );
}