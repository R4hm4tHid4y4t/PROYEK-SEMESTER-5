import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiPackage, FiUsers, FiShoppingCart, FiDollarSign, FiArrowRight, FiTrendingUp,
  FiHome, FiSettings, FiBarChart2, FiChevronLeft, FiChevronRight, FiCalendar,
  FiRefreshCw, FiMoreVertical, FiExternalLink, FiMenu, FiX, FiFileText, FiBox
} from 'react-icons/fi';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { reportService, orderService } from '../../services/api';
import { formatCurrency, formatDateTime, getStatusColor } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import {
  ResponsiveGrid,
  ResponsiveTypography,
  ResponsiveTableWrapper,
} from '../../components/common/ResponsiveLayout';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('monthly');
  const [activeChartTab, setActiveChartTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chartScrollRef = useRef(null);
  const location = useLocation();

  // Admin sidebar navigation items
  const sidebarItems = [
    { label: 'Dashboard', href: '/admin', icon: FiHome },
    { label: 'Produk', href: '/admin/products', icon: FiBox },
    { label: 'Pesanan', href: '/admin/orders', icon: FiShoppingCart },
    { label: 'Member', href: '/admin/members', icon: FiUsers },
    { label: 'Laporan', href: '/admin/reports', icon: FiFileText },
    { label: 'Pengaturan', href: '/admin/settings', icon: FiSettings },
  ];

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [chartPeriod]);

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        reportService.getDashboard(),
        orderService.getRecent()
      ]);
      setStats(statsRes.data.statistics);
      setRecentOrders(ordersRes.data.orders);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await reportService.getChart({ period: chartPeriod });
      setChartData(response.data.chartData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    await fetchChartData();
    setRefreshing(false);
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  const statCards = [
    {
      title: 'Total Pesanan',
      value: stats?.totalOrders || 0,
      icon: FiShoppingCart,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      link: '/admin/orders',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Pesanan Selesai',
      value: stats?.completedOrders || 0,
      icon: FiPackage,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
      link: '/admin/orders',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: FiDollarSign,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      link: '/admin/reports',
      change: '+23%',
      changeType: 'positive'
    },
    {
      title: 'Total Member',
      value: stats?.totalMembers || 0,
      icon: FiUsers,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      link: '/admin/members',
      change: '+5%',
      changeType: 'positive'
    }
  ];

  const quickStats = [
    {
      title: 'Produk Aktif',
      value: stats?.activeProducts || 0,
      subtitle: `dari ${stats?.totalProducts || 0} total produk`,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      title: 'Pesanan Pending',
      value: stats?.pendingOrders || 0,
      subtitle: 'menunggu pembayaran',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Rata-rata Order',
      value: stats?.totalOrders > 0 
        ? formatCurrency(stats.totalRevenue / stats.completedOrders) 
        : formatCurrency(0),
      subtitle: 'per transaksi',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  const chartTabs = [
    { id: 0, label: 'Penjualan', icon: FiTrendingUp },
    { id: 1, label: 'Pesanan', icon: FiShoppingCart },
    { id: 2, label: 'Kategori', icon: FiBarChart2 }
  ];

  const pieData = [
    { name: 'Wisuda', value: 45, color: '#4F46E5' },
    { name: 'Perpisahan', value: 30, color: '#10B981' },
    { name: 'Custom', value: 25, color: '#F59E0B' }
  ];

  const StatCard = ({ card, index }) => {
    const Icon = card.icon;
    return (
      <Link
        to={card.link}
        className="bg-white rounded-xl shadow-sm p-4 sm:p-5 lg:p-6 hover:shadow-md transition-all duration-200 group"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-gray-500 truncate">{card.title}</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 truncate">{card.value}</p>
            <div className="flex items-center gap-1 mt-1 sm:mt-2">
              <span className={`text-xs font-medium ${
                card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {card.change}
              </span>
              <span className="text-xs text-gray-400">vs bulan lalu</span>
            </div>
          </div>
          <div className={`${card.lightColor} ${card.textColor} p-2 sm:p-3 rounded-lg group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
          </div>
        </div>
      </Link>
    );
  };

  const ChartSection = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Chart Header */}
      <div className="p-4 sm:p-5 lg:p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <FiTrendingUp className="w-5 h-5 text-primary-600" />
            <h2 className="text-base sm:text-lg font-semibold">Grafik Penjualan</h2>
          </div>
          
          {/* Period Toggle */}
          <div className="flex gap-1 sm:gap-2 bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
            {['daily', 'weekly', 'monthly'].map((period) => (
              <button
                key={period}
                onClick={() => setChartPeriod(period)}
                className={`min-h-[36px] px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  chartPeriod === period
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period === 'daily' ? 'Harian' : period === 'weekly' ? 'Mingguan' : 'Bulanan'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: Swipeable Chart Tabs */}
      <div className="lg:hidden border-b overflow-x-auto scrollbar-hide">
        <div className="flex">
          {chartTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveChartTab(tab.id)}
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeChartTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-500 border-b-2 border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Chart Content */}
      <div className="p-4 sm:p-5 lg:p-6">
        {chartData.length > 0 ? (
          <div>
            <ResponsiveContainer width="100%" height={300}>
              {activeChartTab === 0 ? (
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickFormatter={(value) => `${(value / 1000)}k`}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                    labelFormatter={(label) => `Tanggal: ${label}`}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#4F46E5" 
                    strokeWidth={2}
                    dot={{ fill: '#4F46E5', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              ) : activeChartTab === 1 ? (
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value) => [value, 'Pesanan']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-sm">{value}</span>}
                  />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FiBarChart2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Belum ada data penjualan</p>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Multi-chart Grid - Stack on mobile, grid on desktop */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-6 p-6 pt-0 border-t">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Pesanan per Periode</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
              <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Penjualan per Kategori</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
              <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const RecentOrdersSection = () => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 lg:p-6 border-b flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold">Pesanan Terbaru</h2>
        <Link 
          to="/admin/orders" 
          className="min-h-[36px] px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1"
        >
          Lihat Semua <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      {recentOrders.length === 0 ? (
        <div className="p-8 text-center">
          <FiShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Belum ada pesanan</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card List */}
          <div className="lg:hidden divide-y">
            {recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      #{order.id} - {order.product_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{order.user_name}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(order.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold">{formatCurrency(order.total_price)}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tablet/Desktop: Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Order ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Produk</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Tanggal</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium">#{order.id}</td>
                    <td className="py-3 px-4 text-gray-900 max-w-[200px] truncate">{order.product_name}</td>
                    <td className="py-3 px-4 text-gray-600">{order.user_name}</td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(order.total_price)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{formatDateTime(order.created_at)}</td>
                    <td className="py-3 px-4 text-center">
                      <Link 
                        to={`/admin/orders/${order.id}`}
                        className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <FiExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );

  const QuickStatsSection = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      {quickStats.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} rounded-xl p-4 sm:p-5 lg:p-6`}>
          <h3 className="text-sm font-medium text-gray-700">{stat.title}</h3>
          <p className={`text-2xl sm:text-3xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{stat.subtitle}</p>
        </div>
      ))}
    </div>
  );

  // Quick Actions with touch-friendly 44px minimum buttons
  const QuickActionsSection = () => {
    const quickActions = [
      { label: 'Tambah Produk', href: '/admin/products/new', icon: FiBox, color: 'bg-primary-600 hover:bg-primary-700 text-white' },
      { label: 'Lihat Pesanan', href: '/admin/orders', icon: FiShoppingCart, color: 'bg-green-600 hover:bg-green-700 text-white' },
      { label: 'Kelola Member', href: '/admin/members', icon: FiUsers, color: 'bg-purple-600 hover:bg-purple-700 text-white' },
      { label: 'Laporan', href: '/admin/reports', icon: FiFileText, color: 'bg-orange-600 hover:bg-orange-700 text-white' },
    ];

    return (
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 lg:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.href}
                className={`min-h-[44px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${action.color}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  // Admin Sidebar Component - Drawer on mobile, fixed on desktop
  const AdminSidebar = () => (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 
          lg:translate-x-0 lg:z-30
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link to="/admin" className="text-xl font-bold text-primary-600">
            Admin Panel
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden min-h-[44px] min-w-[44px] p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
              (item.href !== '/admin' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`min-h-[44px] flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Sidebar - Drawer on mobile, fixed on desktop */}
      <AdminSidebar />

      {/* Main Content Area - offset for sidebar on desktop */}
      <div className="lg:ml-64 min-h-screen">
        {/* Mobile Header with Menu Toggle */}
        <div className="lg:hidden sticky top-0 bg-white border-b z-30 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="min-h-[44px] min-w-[44px] p-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
              aria-label="Open menu"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <span className="text-lg font-semibold text-gray-900">Dashboard</span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="min-h-[44px] min-w-[44px] p-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
              aria-label="Refresh"
            >
              <FiRefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 pb-20 lg:pb-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Selamat datang di Admin Panel SelempangKu
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="min-h-[44px] px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
                <FiCalendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Stats Cards - 1 col mobile, 2 col tablet, 4 col desktop */}
          <ResponsiveGrid cols={4} gap={6}>
            {statCards.map((card, index) => (
              <StatCard key={index} card={card} index={index} />
            ))}
          </ResponsiveGrid>

          {/* Quick Actions - Touch-friendly 44px buttons */}
          <QuickActionsSection />

          {/* Charts and Orders - Stack on mobile/tablet, side-by-side on desktop */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            <div className="xl:col-span-2">
              <ChartSection />
            </div>
            <div className="xl:col-span-1">
              <RecentOrdersSection />
            </div>
          </div>

          {/* Quick Stats */}
          <QuickStatsSection />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
