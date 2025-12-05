import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPackage,
  FiUsers,
  FiShoppingCart,
  FiDollarSign,
  FiArrowRight,
  FiCalendar,
  FiRefreshCw,
  FiExternalLink,
  FiCreditCard,
} from 'react-icons/fi';
import { reportService, orderService, paymentService } from '../../services/api';
import { formatCurrency, getStatusColor } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import { ResponsiveGrid } from '../../components/common/ResponsiveLayout';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [allOrders, setAllOrders] = useState([]); // semua pesanan
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchStatsAndOrders(), fetchPayments()]);
    setLoading(false);
  };

  const fetchStatsAndOrders = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        reportService.getDashboard(),
        orderService.getAll({}), // ambil SEMUA pesanan, bukan getRecent()
      ]);
      setStats(statsRes.data.statistics);
      
      // Sort berdasarkan created_at terbaru dan ambil 10 teratas
      const sortedOrders = ordersRes.data.orders.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setAllOrders(sortedOrders.slice(0, 10));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      const res = await paymentService.getAll({});
      setPayments(res.data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStatsAndOrders(), fetchPayments()]);
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
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      link: '/admin/orders',
    },
    {
      title: 'Pesanan Selesai',
      value: stats?.completedOrders || 0,
      icon: FiPackage,
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
      link: '/admin/orders',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: FiDollarSign,
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      link: '/admin/reports',
    },
    {
      title: 'Total Member',
      value: stats?.totalMembers || 0,
      icon: FiUsers,
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      link: '/admin/members',
    },
  ];

  const quickStats = [
    {
      title: 'Produk Aktif',
      value: stats?.activeProducts || 0,
      subtitle: `dari ${stats?.totalProducts || 0} total produk`,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Pesanan Pending',
      value: stats?.pendingOrders || 0,
      subtitle: 'menunggu pembayaran',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Rata-rata Order',
      value:
        stats?.completedOrders > 0
          ? formatCurrency(stats.totalRevenue / stats.completedOrders)
          : formatCurrency(0),
      subtitle: 'per transaksi',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  const StatCard = ({ card }) => {
    const Icon = card.icon;
    return (
      <Link
        to={card.link}
        className="bg-white rounded-xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-all duration-200 group border border-gray-100"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-gray-500 truncate">{card.title}</p>
            <p className="text-lg sm:text-xl font-bold mt-1 truncate text-gray-900">
              {card.value}
            </p>
          </div>
          <div
            className={`${card.lightColor} ${card.textColor} p-2.5 rounded-lg group-hover:scale-110 transition-transform`}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </Link>
    );
  };

  const RecentOrdersSection = () => {
    // allOrders sudah di-sort dan dibatasi 10 di fetchStatsAndOrders
    const newOrders = allOrders;

    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 h-full">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Pesanan Baru</h2>
            <p className="text-xs text-gray-500">
              10 pesanan terbaru (semua status).
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
          >
            Lihat Semua <FiArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {newOrders.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <FiShoppingCart className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm">Belum ada pesanan</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-gray-100">
              {newOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        #{order.id}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5 truncate">
                        {order.user_name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total_price)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {newOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <span className="font-medium text-gray-900">
                          {order.user_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {formatCurrency(order.total_price)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
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
  };

  const PaymentsSection = () => {
    const listPayments = payments.slice(0, 10);

    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 h-full">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Konfirmasi Pembayaran</h2>
            <p className="text-xs text-gray-500">
              10 pembayaran terakhir (ID Payment, Customer, Jumlah, Status).
            </p>
          </div>
          <Link
            to="/admin/payments"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
          >
            Lihat Semua <FiArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loadingPayments ? (
          <div className="p-8 flex items-center justify-center h-64">
            <Loader />
          </div>
        ) : listPayments.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <FiCreditCard className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm">
              Belum ada data pembayaran
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-gray-100">
              {listPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900">
                        ID Payment #{p.id}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {p.user_name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-primary-600">
                        {formatCurrency(p.amount)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusColor(
                          p.status
                        )}`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      ID Payment
                    </th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="text-left py-2.5 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listPayments.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">
                        #{p.id}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <span className="font-medium text-gray-900">
                          {p.user_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-primary-600">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                            p.status
                          )}`}
                        >
                          {p.status}
                        </span>
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
  };

  const QuickStatsSection = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {quickStats.map((stat, index) => (
        <div
          key={index}
          className={`${stat.bgColor} rounded-xl p-4 border border-transparent`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {stat.title}
              </h3>
              <p className={`text-2xl font-bold ${stat.color} mt-1`}>
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 mt-1 opacity-80">
                {stat.subtitle}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header desktop */}
      <div className="hidden lg:flex lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pantau performa toko Anda hari ini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 shadow-sm">
            <FiCalendar className="w-4 h-4 text-gray-400" />
            <span>
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
          >
            <FiRefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Header mobile */}
      <div className="lg:hidden flex items-center justify-between">
        <span className="text-base font-bold text-gray-900">Dashboard</span>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <FiRefreshCw
            className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      <ResponsiveGrid cols={4} gap={5}>
        {statCards.map((card, index) => (
          <StatCard key={index} card={card} />
        ))}
      </ResponsiveGrid>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <RecentOrdersSection />
        <PaymentsSection />
      </div>

      <QuickStatsSection />
    </div>
  );
};

export default Dashboard;
