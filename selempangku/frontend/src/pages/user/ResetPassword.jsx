import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiLock, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { ResponsiveContainer, ResponsiveTypography } from '../../components/common/ResponsiveLayout';

const ResetPassword = () => {
  const { token } = useParams();
  const { resetPassword } = useAuth();
  const { register, handleSubmit, formState: { isSubmitting, errors }, watch } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      await resetPassword(token, data.password);
      setSuccess(true);
      toast.success('Password berhasil direset');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Token tidak valid atau sudah kadaluarsa');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 sm:py-12 overflow-x-hidden">
        <ResponsiveContainer>
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
              </div>
              <ResponsiveTypography.H2 className="text-gray-900 mb-2">Password Berhasil Direset</ResponsiveTypography.H2>
              <ResponsiveTypography.Body className="text-gray-600 mb-6">
                Password Anda telah berhasil diubah. Silakan login dengan password baru.
              </ResponsiveTypography.Body>
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-primary-600 text-white text-base font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Login Sekarang
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
            <ResponsiveTypography.H2 className="text-gray-900">Reset Password</ResponsiveTypography.H2>
            <ResponsiveTypography.Body className="mt-2 text-gray-600">
              Masukkan password baru Anda
            </ResponsiveTypography.Body>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">Password Baru</label>
                <div className="relative">
                  <FiLock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { 
                      required: 'Password harus diisi',
                      minLength: { value: 6, message: 'Password minimal 6 karakter' }
                    })}
                    className="w-full min-h-[48px] pl-10 sm:pl-12 pr-12 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('confirmPassword', { 
                      required: 'Konfirmasi password harus diisi',
                      validate: value => value === password || 'Password tidak cocok'
                    })}
                    className="w-full min-h-[48px] pl-10 sm:pl-12 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Ulangi password baru"
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[48px] py-3 bg-primary-600 text-white text-base font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Menyimpan...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
};

export default ResetPassword;
