import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiUser, FiMail, FiLock, FiPhone, FiMapPin, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { ResponsiveContainer, ResponsiveTypography } from '../../components/common/ResponsiveLayout';

const Register = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm();
  const password = useRef({});
  password.current = watch("password", "");
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await registerAuth(registerData);
      toast.success('Registrasi berhasil! Silakan cek email untuk verifikasi.');
      navigate('/verify-email', { state: { email: data.email } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat registrasi');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 sm:py-12 overflow-x-hidden">
      <ResponsiveContainer>
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <ResponsiveTypography.H2 className="text-gray-900">Daftar Akun Baru</ResponsiveTypography.H2>
            <ResponsiveTypography.Body className="mt-2 text-gray-600">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                Masuk di sini
              </Link>
            </ResponsiveTypography.Body>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <FiUser className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    {...register('name', { required: 'Nama lengkap harus diisi' })}
                    className="w-full min-h-[48px] pl-10 sm:pl-12 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Masukkan nama lengkap"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    {...register('email', { required: 'Email harus diisi' })}
                    className="w-full min-h-[48px] pl-10 sm:pl-12 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Masukkan email"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">Password</label>
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

              {/* Konfirmasi Password */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('confirmPassword', { 
                      required: 'Konfirmasi password harus diisi',
                      validate: value => value === password.current || "Password tidak cocok"
                    })}
                    className="w-full min-h-[48px] pl-10 sm:pl-12 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Ulangi password"
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
              </div>

              {/* No. Telepon - UPDATED */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">No. Telepon</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    {...register('phone', { required: 'Nomor telepon harus diisi' })}
                    className="w-full min-h-[48px] pl-10 sm:pl-12 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
              </div>

              {/* Alamat - UPDATED */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">Alamat</label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 sm:left-4 top-3 text-gray-400 w-5 h-5" />
                  <textarea
                    {...register('address', { required: 'Alamat harus diisi' })}
                    rows={3}
                    className="w-full min-h-[100px] pl-10 sm:pl-12 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                    placeholder="Masukkan alamat lengkap"
                  />
                </div>
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[48px] py-3 bg-primary-600 text-white text-base font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Mendaftar...' : 'Daftar Sekarang'}
              </button>
            </form>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
};

export default Register;