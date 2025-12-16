import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiSave, FiCamera, FiShield, FiClock, FiEdit3 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/api';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';

const tabs = [
  { id: 'profile', label: 'Profil', icon: FiUser, shortLabel: 'Profil' },
  { id: 'password', label: 'Ubah Password', icon: FiLock, shortLabel: 'Password' },
  { id: 'security', label: 'Keamanan', icon: FiShield, shortLabel: 'Keamanan' },
];

const ProfileForm = ({ defaultValues, onSubmit, saving }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <FiEdit3 className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Informasi Profil</h2>
          <p className="text-sm text-gray-500">Perbarui informasi profil Anda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama Lengkap
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                {...register('name', { required: 'Nama harus diisi' })}
                className="w-full min-h-[44px] sm:min-h-[48px] pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                {...register('email')}
                disabled
                className="w-full min-h-[44px] sm:min-h-[48px] pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-gray-500"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Email tidak dapat diubah</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            No. Telepon
          </label>
          <div className="relative">
            <FiPhone className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="tel"
              {...register('phone')}
              className="w-full min-h-[44px] sm:min-h-[48px] pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Contoh: 08123456789"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Alamat
          </label>
          <div className="relative">
            <FiMapPin className="absolute left-3 sm:left-4 top-3 sm:top-4 text-gray-400 w-5 h-5" />
            <textarea
              {...register('address')}
              rows={3}
              className="w-full min-h-[100px] pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
              placeholder="Masukkan alamat lengkap"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-[48px] px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FiSave className="w-5 h-5" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
};

const PasswordForm = ({ onSubmit, changingPassword }) => {
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();
  const newPassword = watch('newPassword');

  const handlePasswordSubmit = async (data) => {
    await onSubmit(data);
    reset();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <FiLock className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Ubah Password</h2>
          <p className="text-sm text-gray-500">Perbarui password akun Anda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(handlePasswordSubmit)} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Password Saat Ini
          </label>
          <div className="relative">
            <FiLock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              {...register('currentPassword', { required: 'Password saat ini harus diisi' })}
              className="w-full min-h-[44px] sm:min-h-[48px] pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
          {errors.currentPassword && <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password Baru
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                {...register('newPassword', { 
                  required: 'Password baru harus diisi',
                  minLength: { value: 6, message: 'Password minimal 6 karakter' }
                })}
                className="w-full min-h-[44px] sm:min-h-[48px] pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Minimal 6 karakter"
              />
            </div>
            {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                {...register('confirmPassword', { 
                  required: 'Konfirmasi password harus diisi',
                  validate: value => value === newPassword || 'Password tidak cocok'
                })}
                className="w-full min-h-[44px] sm:min-h-[48px] pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={changingPassword}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-[48px] px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FiLock className="w-5 h-5" />
            {changingPassword ? 'Mengubah...' : 'Ubah Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

const SecuritySection = () => (
  <div className="space-y-4 sm:space-y-6">
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <FiShield className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Keamanan Akun</h2>
          <p className="text-sm text-gray-500">Kelola pengaturan keamanan akun</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FiShield className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-green-800">Akun Terverifikasi</h3>
              <p className="text-xs text-green-700 mt-0.5">Email Anda telah terverifikasi</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <FiClock className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Login Terakhir</h3>
              <p className="text-xs text-gray-500 mt-0.5">Hari ini, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Aktivitas Terbaru</h3>
      
      <div className="sm:hidden space-y-3">
        {[
          { action: 'Login berhasil', device: 'Chrome, Windows', time: 'Hari ini, 10:30' },
          { action: 'Profil diperbarui', device: 'Mobile App', time: 'Kemarin, 14:22' },
          { action: 'Password diubah', device: 'Chrome, Windows', time: '3 hari lalu' },
        ].map((activity, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500 mt-0.5">{activity.device}</p>
              </div>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Aktivitas</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Perangkat</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Waktu</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[
              { action: 'Login berhasil', device: 'Chrome, Windows', time: 'Hari ini, 10:30' },
              { action: 'Profil diperbarui', device: 'Mobile App', time: 'Kemarin, 14:22' },
              { action: 'Password diubah', device: 'Chrome, Windows', time: '3 hari lalu' },
            ].map((activity, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900">{activity.action}</td>
                <td className="py-3 px-4 text-gray-500">{activity.device}</td>
                <td className="py-3 px-4 text-gray-400">{activity.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const Profile = () => {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userService.getProfile();
      const userData = response.data.user;
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 2MB');
        return;
      }
      setAvatarPreview(URL.createObjectURL(file));
      toast.success('Avatar berhasil dipilih');
    }
  };

  const handleProfileSubmit = async (data) => {
    setSaving(true);
    try {
      const response = await userService.updateProfile({
        name: data.name,
        phone: data.phone,
        address: data.address
      });
      updateUser(response.data.user);
      setProfileData(prev => ({ ...prev, name: data.name, phone: data.phone, address: data.address }));
      toast.success('Profil berhasil diperbarui');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (data) => {
    setChangingPassword(true);
    try {
      await userService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success('Password berhasil diubah');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  const SidebarNav = ({ className = '' }) => (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${className}`}>
      <div className="p-4 sm:p-6 border-b bg-gradient-to-br from-primary-500 to-primary-600">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl sm:text-3xl font-bold text-white">
                  {getInitials(profileData.name || 'U')}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-primary-600 hover:bg-gray-50 transition-colors"
            >
              <FiCamera className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <h2 className="mt-3 text-base sm:text-lg font-semibold text-white text-center">
            {profileData.name || 'User'}
          </h2>
          <p className="text-sm text-white/80">{profileData.email}</p>
        </div>
      </div>

      <nav className="p-2 sm:p-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg text-left transition-colors min-h-[48px] ${
                activeTab === tab.id
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm sm:text-base">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  const MobileTabNav = () => (
    <div className="md:hidden bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-white">
                {getInitials(profileData.name || 'U')}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-primary-600"
          >
            <FiCamera className="w-3 h-3" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-white truncate">{profileData.name}</h2>
          <p className="text-sm text-white/80 truncate">{profileData.email}</p>
        </div>
      </div>

      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[100px] flex flex-col items-center gap-1 px-3 py-3 text-center transition-colors min-h-[60px] ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-500 border-b-2 border-transparent'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 mx-auto max-w-[360px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1366px] py-4 sm:py-6 md:py-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
          Profil Saya
        </h1>

        <MobileTabNav />

        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 lg:gap-8">
          <aside className="hidden md:block w-64 lg:w-72 xl:w-80 flex-shrink-0">
            <SidebarNav className="sticky top-24" />
          </aside>

          <main className="flex-1 min-w-0">
            {activeTab === 'profile' && (
              <ProfileForm 
                defaultValues={profileData} 
                onSubmit={handleProfileSubmit} 
                saving={saving} 
              />
            )}
            {activeTab === 'password' && (
              <PasswordForm 
                onSubmit={handlePasswordSubmit} 
                changingPassword={changingPassword} 
              />
            )}
            {activeTab === 'security' && <SecuritySection />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile;
