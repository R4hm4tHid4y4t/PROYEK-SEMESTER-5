import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { ResponsiveContainer, ResponsiveTypography } from '../../components/common/ResponsiveLayout';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('Link reset password telah dikirim ke email Anda');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Email tidak ditemukan');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 sm:py-12 overflow-x-hidden">
        <ResponsiveContainer>
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
              </div>
              <ResponsiveTypography.H2 className="text-gray-900 mb-2">Email Terkirim</ResponsiveTypography.H2>
              <ResponsiveTypography.Body className="text-gray-600 mb-6">
                Kami telah mengirim link reset password ke <strong>{email}</strong>. 
                Silakan cek inbox atau folder spam Anda.
              </ResponsiveTypography.Body>
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-primary-600 text-white text-base font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Kembali ke Login
              </Link>
            </div>
          </div>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 sm:py-12 overflow-x-hidden">
      <ResponsiveContainer>
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <ResponsiveTypography.H2 className="text-gray-900">Lupa Password</ResponsiveTypography.H2>
            <ResponsiveTypography.Body className="mt-2 text-gray-600">
              Masukkan email Anda dan kami akan mengirimkan link untuk reset password
            </ResponsiveTypography.Body>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-[48px] pl-10 sm:pl-12 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Masukkan email Anda"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] py-3 bg-primary-600 text-white text-base font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center gap-2 text-base text-primary-600 hover:text-primary-500 min-h-[44px]"
              >
                <FiArrowLeft className="w-5 h-5" /> Kembali ke Login
              </Link>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
};

export default ForgotPassword;
