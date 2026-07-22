'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useProductStore } from '../../store/productStore';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import './Analytics.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    successfulOrders: 0,
    cancelledOrders: 0,
    totalProductsSold: 0,
    returnReplacementOrders: 0,
    averageOrderValue: 0,
    dailyRevenue: [],
    orderStatusBreakdown: [],
    topProducts: []
  });

  const [productsData, setProductsData] = useState({
    totalProducts: 0
  });

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [analyticsCurrency, setAnalyticsCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);
  const { currencySettings } = useProductStore();

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchAnalytics();
    fetchProductsData();
  }, [dateRange, analyticsCurrency]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/orders/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          currency: analyticsCurrency,
          topProductsLimit: 10
        }
      });
      setAnalyticsData(response.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsData({
        totalRevenue: 0, totalOrders: 0, successfulOrders: 0, cancelledOrders: 0, totalProductsSold: 0, returnReplacementOrders: 0, averageOrderValue: 0,
        dailyRevenue: [], orderStatusBreakdown: [], topProducts: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsData = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10000 } // Get total count from all products
      });
      setProductsData({
        totalProducts: response.data.total || response.data.data?.length || 0
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching products:', error);
      setProductsData({ totalProducts: 0 });
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const currencySymbols = {
    INR: '₹',
    KWD: 'KWD'
  };

  const formatCurrency = (amount) => {
    const symbol = currencySymbols[analyticsCurrency] || currencySettings?.symbol || '₹';
    const value = Number(amount || 0);
    return analyticsCurrency === 'KWD'
      ? `${symbol} ${value.toFixed(3)}`
      : `${symbol} ${value.toLocaleString()}`;
  };

  const renderCurrencyValue = (amount) => {
    const symbol = currencySymbols[analyticsCurrency] || currencySettings?.symbol || '₹';
    const value = Number(amount || 0);
    const formattedValue = analyticsCurrency === 'KWD'
      ? value.toFixed(3)
      : value.toLocaleString();
    
    if (analyticsCurrency === 'KWD') {
      return (
        <>
          <span className="currency-code">{symbol}</span> {formattedValue}
        </>
      );
    }
    return `${symbol} ${formattedValue}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
  };

  // 2nd Image Premium Colors Theme mapped to Statuses
  const STATUS_COLORS = {
    'delivered': '#28a745',   // Teal (like Zomato)
    'shipped': '#3195ed',     // Blue (like Home Delivery)
    'processing': '#e08c42',  // Orange (like Dine In)
    'pending': '#7b56c5',     // Purple (like Swiggy)
    'cancelled': '#db3235'    // Red/Pink (like Take Away)
  };

  // Filter logic: Only show statuses in the chart that actually have orders > 0
  const activeChartData = analyticsData.orderStatusBreakdown?.filter(item => item.count > 0) || [];

  // Custom Tooltip for Revenue Area Chart
  const CustomRevenueTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{formatDate(label)}</p>
          <p className="tooltip-value">Revenue: <span>{formatCurrency(payload[0].value)}</span></p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Donut/Pie Chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (!data) return null;

      if (!data.status) {
        // Center pie tooltip for total placed orders
        return (
          <div className="custom-tooltip pie-tooltip">
            <p className="tooltip-status" style={{ color: '#374151' }}>
              TOTAL PLACED ORDERS
            </p>
            <p className="tooltip-value">Count: <span>{data.value}</span></p>
          </div>
        );
      }

      return (
        <div className="custom-tooltip pie-tooltip">
          <p className="tooltip-status" style={{ color: STATUS_COLORS[data.status] || '#64748b' }}>
            {data.status.toUpperCase()}
          </p>
          <p className="tooltip-value">Orders: <span>{data.count}</span></p>
        </div>
      );
    }
    return null;
  };

  // 2nd Image Style Legend: Semi-circle icons at the bottom
  const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
      <div className="custom-pie-legend-img2">
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="legend-item-img2">
            <svg width="24" height="12" viewBox="0 0 24 12" className="legend-slice-icon">
              {/* Draws a semi-circle shape like a pie slice */}
              <path d="M 0 12 A 12 12 0 0 1 24 12 Z" fill={entry.color} />
            </svg>
            <span>{entry.payload?.name || entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // 2nd Image Style Custom Label with lines
  const renderCustomLabel = ({ cx, cy, x, y, name, fill }) => {
    return (
      <text 
        x={x} y={y} 
        fill={fill} 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central" 
        fontSize="13px" 
        fontWeight="600" 
        style={{ textTransform: 'capitalize' }}
      >
        {name}
      </text>
    );
  };

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="header-title">
          <h2>Dashboard Analytics</h2>
          <p>Monitor your sales, revenue, and order status in real-time.</p>
          <div className="last-update">
            <i className="fas fa-clock"></i>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
        
        <div className="date-filters">
          <div className="filter-group">
            <label>Start Date</label>
            <input 
              type="date" 
              value={dateRange.startDate} 
              onChange={(e) => handleDateChange('startDate', e.target.value)} 
              className="date-input" 
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input 
              type="date" 
              value={dateRange.endDate} 
              onChange={(e) => handleDateChange('endDate', e.target.value)} 
              className="date-input" 
            />
          </div>
          <div className="filter-group currency-switch">
            <label>Analytics Currency</label>
            <div className="currency-toggle-group">
              <button
                type="button"
                className={`currency-toggle ${analyticsCurrency === 'INR' ? 'active' : ''}`}
                onClick={() => setAnalyticsCurrency('INR')}
              >
                INR
              </button>
              <button
                type="button"
                className={`currency-toggle ${analyticsCurrency === 'KWD' ? 'active' : ''}`}
                onClick={() => setAnalyticsCurrency('KWD')}
              >
                KWD
              </button>
            </div>
          </div>
          <button onClick={() => { fetchAnalytics(); fetchProductsData(); }} className="refresh-btn" disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Analyzing your data...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon bg-green"><i className="fas fa-wallet"></i></div>
              <div className="metric-content">
                <h3>Total Revenue</h3>
                <p className="metric-value">{renderCurrencyValue(analyticsData.totalRevenue)}</p>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon bg-blue"><i className="fas fa-shopping-bag"></i></div>
              <div className="metric-content">
                <h3>Total Orders</h3>
                <p className="metric-value">{analyticsData.totalOrders}</p>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon bg-teal"><i className="fas fa-check-circle"></i></div>
              <div className="metric-content">
                <h3>Successful Orders</h3>
                <p className="metric-value">{analyticsData.successfulOrders ?? 0}</p>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon bg-orange"><i className="fas fa-sync-alt"></i></div>
              <div className="metric-content">
                <h3>Return & Replacement Orders</h3>
                <p className="metric-value">{analyticsData.returnReplacementOrders ?? 0}</p>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon bg-red"><i className="fas fa-times-circle"></i></div>
              <div className="metric-content">
                <h3>Cancelled Orders</h3>
                <p className="metric-value">{analyticsData.cancelledOrders ?? 0}</p>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon bg-purple"><i className="fas fa-box-open"></i></div>
              <div className="metric-content">
                <h3>Products Sold</h3>
                <p className="metric-value">{analyticsData.totalProductsSold ?? 0}</p>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon bg-indigo"><i className="fas fa-cubes"></i></div>
              <div className="metric-content">
                <h3>Total Products Available</h3>
                <p className="metric-value">{productsData.totalProducts}</p>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon bg-yellow"><i className="fas fa-chart-line"></i></div>
              <div className="metric-content">
                <h3>Avg Order Value</h3>
                <p className="metric-value">{renderCurrencyValue(analyticsData.averageOrderValue)}</p>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            {/* Area Chart - Revenue */}
            <div className="chart-box revenue-chart-box">
              <h3>Revenue Overview</h3>
              {analyticsData.dailyRevenue?.length > 0 ? (
                <div className="recharts-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData.dailyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                          </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                      <XAxis dataKey="date" tickFormatter={formatDate} tick={{fill: 'var(--text-muted)', fontSize: 12}} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(val) => `${currencySymbols[analyticsCurrency] || currencySettings?.symbol || '₹'}${analyticsCurrency === 'KWD' ? Number(val).toFixed(3) : Number(val).toLocaleString()}`} tick={{fill: 'var(--text-muted)', fontSize: 12}} axisLine={false} tickLine={false} />
                      <RechartsTooltip content={<CustomRevenueTooltip />} />
                      <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="no-data">No revenue data available</div>
              )}
            </div>

            {/* Donut Chart - Match 2nd Image Style */}
            <div className="chart-box status-chart-box">
              <h3>Order Status Breakdown</h3>
              {activeChartData.length > 0 ? (
                <div className="recharts-wrapper donut-wrapper-img2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                      
                      {/* Outer Thin Decorative Border (Light Gray) */}
                      <Pie
                        data={[{ value: 1 }]}
                        cx="50%" cy="45%"
                        innerRadius={118} outerRadius={119}
                        fill="var(--border-color)" stroke="none"
                        isAnimationActive={false}
                        tooltipType="none"
                        legendType="none"
                      />
                       
                      

                      {/* Center Total Placed Orders Pie */}
                      <Pie
                        data={[{ name: 'Total Placed Orders', value: analyticsData.totalOrders }]}
                        cx="50%"
                        cy="45%"
                        innerRadius={0}
                        outerRadius={60}
                        fill="var(--table-header)"
                        stroke="var(--border-color)"
                        strokeWidth={1}
                        isAnimationActive={false}
                        nameKey="name"
                        label={({ cx, cy }) => (
                          <>
                            <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="700" fill="var(--text-main)">
                              {analyticsData.totalOrders}
                            </text>
                            <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="600" fill="var(--text-muted)">
                              TOTAL PLACED ORDERS
                            </text>
                          </>
                        )}
                      >
                        <Cell fill="var(--text-muted)" />
                      </Pie>

                      {/* Main Data Ring with Lines and Labels */}
                      <Pie
                        data={activeChartData}
                        cx="50%"
                        cy="45%"
                        innerRadius={80}
                        outerRadius={108}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="status"
                        stroke="var(--border-color)"
                        strokeWidth={2}
                        labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 1, length1: 15, length2: 15 }}
                        label={renderCustomLabel}
                      >
                        {activeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || 'var(--border-color)'} className="pie-cell" />
                        ))}
                      </Pie>

                      <RechartsTooltip content={<CustomPieTooltip />} />
                      <Legend content={renderCustomLegend} verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="no-data">No active orders available to map</div>
              )}
            </div>
          </div>

          {/* Top Products */}
          {analyticsData.topProducts && analyticsData.topProducts.length > 0 && (
            <div className="top-products-section">
              <h3>Top Performing Products</h3>
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Product Name</th>
                      <th className="text-right">Units Sold</th>
                      <th className="text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.topProducts.map((product, index) => (
                      <tr key={product.id || index}>
                        <td>
                          <span className={`rank-badge rank-${index + 1}`}>{index + 1}</span>
                        </td>
                        <td className="product-name">{product.name}</td>
                        <td className="text-right fw-600">{product.totalSold}</td>
                        <td className="text-right text-green fw-600">{formatCurrency(product.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}