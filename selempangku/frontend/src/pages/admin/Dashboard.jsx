import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiUsers, FiShoppingCart, FiDollarSign, FiArrowRight, FiTrendingUp } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { reportService, orderService } from '../../services/api';
import { formatCurrency, formatDateTime, getStatusColor } from '../../utils/helpers';
import Loader from '../../components/common/Loader';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('monthly');

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

  if (loading) {
    return <Loader fullScreen />;
  }

  const statCards = [
    {
      title: 'Total Pesanan',
      value: stats?.totalOrders || 0,
      icon: <FiShoppingCart className="w-8 h-8" />,
      color: 'bg-blue-500',
      link: '/admin/orders'
    },
    {
      title: 'Pesanan Selesai',
      value: stats?.completedOrders || 0,
      icon: <FiPackage className="w-8 h-8" />,
      color: 'bg-green-500',
      link: '/admin/orders'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: <FiDollarSign className="w-8 h-8" />,
      color: 'bg-purple-500',
      link: '/admin/reports'
    },
    {
      title: 'Total Member',
      value: stats?.totalMembers || 0,
      icon: <FiUsers className="w-8 h-8" />,
      color: 'bg-orange-500',
      link: '/admin/members'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Selamat datang di Admin Panel SelempangKu
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} text-white p-3 rounded-lg`}>
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">
              <FiTrendingUp className="inline mr-2" />
              Grafik Penjualan
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setChartPeriod('daily')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  chartPeriod === 'daily'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Harian
              </button>
              <button
                onClick={() => setChartPeriod('monthly')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  chartPeriod === 'monthly'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Bulanan
              </button>
            </div>
          </div>
          
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#4F46E5" 
                  strokeWidth={2}
                  dot={{ fill: '#4F46E5' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Belum ada data penjualan
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pesanan Terbaru</h2>
            <Link to="/admin/orders" className="text-primary-600 text-sm hover:underline flex items-center gap-1">
              Lihat Semua <FiArrowRight />
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Belum ada pesanan</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">#{order.id} - {order.product_name}</p>
                    <p className="text-xs text-gray-500">{order.user_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(order.total_price)}</p>
                    <span className={`badge text-xs ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-2">Produk Aktif</h3>
          <p className="text-3xl font-bold text-primary-600">{stats?.activeProducts || 0}</p>
          <p className="text-sm text-gray-500">dari {stats?.totalProducts || 0} total produk</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-2">Pesanan Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats?.pendingOrders || 0}</p>
          <p className="text-sm text-gray-500">menunggu pembayaran</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-2">Rata-rata Order</h3>
          <p className="text-3xl font-bold text-green-600">
            {stats?.totalOrders > 0 
              ? formatCurrency(stats.totalRevenue / stats.completedOrders) 
              : formatCurrency(0)
            }
          </p>
          <p className="text-sm text-gray-500">per transaksi</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
