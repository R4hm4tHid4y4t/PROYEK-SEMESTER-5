import React, { useState, useEffect } from 'react';
import { FiTrash2, FiUser, FiCheck, FiX, FiRefreshCw, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { userService } from '../../services/api';
import { formatDateTime } from '../../utils/helpers';
import DataTable from '../../components/admin/DataTable';
import { toast } from 'react-toastify';
import Loader from '../../components/common/Loader';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await userService.getMembers();
      setMembers(response.data.members);
    } catch (error) {
      toast.error('Gagal memuat data member');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus member ini secara permanen?')) return;
    try {
      await userService.deleteMember(id);
      toast.success('Member berhasil dihapus');
      fetchMembers();
      setShowDetail(false);
    } catch (error) {
      toast.error('Gagal menghapus member');
    }
  };

  const getInitials = (name) => name?.substring(0, 2).toUpperCase() || 'U';

  // Kolom untuk Desktop (1024px+)
  const desktopColumns = [
    {
      header: 'Member',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold shadow-sm">
            {getInitials(row.name)}
          </div>
          <div>
            <p className="font-bold text-gray-900">{row.name}</p>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
          row.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {row.is_verified ? <FiCheck className="w-3.5 h-3.5" /> : <FiX className="w-3.5 h-3.5" />}
          {row.is_verified ? 'Verified' : 'Unverified'}
        </span>
      )
    },
    {
      header: 'Bergabung',
      render: (row) => <span className="text-sm text-gray-600">{formatDateTime(row.created_at)}</span>
    },
    {
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => { setSelectedMember(row); setShowDetail(true); }}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <FiUser className="w-5 h-5" />
          </button>
          <button 
            onClick={() => handleDelete(row.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      )
    }
  ];

  // Kolom untuk Tablet (768px - 1023px)
  const tabletColumns = [
    {
      header: 'Member',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
            {getInitials(row.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{row.name}</p>
            <p className="text-xs text-gray-500 truncate">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <div className={`w-2 h-2 rounded-full ${row.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`} 
             title={row.is_verified ? 'Verified' : 'Unverified'} />
      )
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex gap-1">
          <button 
            onClick={() => { setSelectedMember(row); setShowDetail(true); }}
            className="p-2 text-gray-600 hover:bg-blue-50 rounded-lg"
          >
            <FiUser className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDelete(row.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Card component untuk mobile - Optimized untuk 360px
  const MemberCard = ({ member }) => (
    <div 
      onClick={() => { setSelectedMember(member); setShowDetail(true); }} 
      className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm active:bg-gray-50 cursor-pointer"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
          {getInitials(member.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-900 text-sm truncate">{member.name}</p>
          <p className="text-xs text-gray-500 truncate">{member.email}</p>
        </div>
      </div>
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ml-2 ${
        member.is_verified ? 'bg-green-500 ring-2 ring-green-100' : 'bg-yellow-500 ring-2 ring-yellow-100'
      }`} />
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsive untuk 360px */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">Data Member</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Total {members.length} pengguna</p>
        </div>
        <button 
          onClick={fetchMembers} 
          disabled={loading}
          className="p-2 sm:p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shadow-sm flex-shrink-0"
        >
          <FiRefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader />
          </div>
        ) : (
          <>
            {/* Desktop Table (1024px+) */}
            <div className="hidden lg:block">
              <DataTable columns={desktopColumns} data={members} loading={loading} emptyMessage="Belum ada data member" />
            </div>

            {/* Tablet Table (768px - 1023px) */}
            <div className="hidden md:block lg:hidden">
              <DataTable columns={tabletColumns} data={members} loading={loading} emptyMessage="Belum ada data member" />
            </div>

            {/* Mobile Cards (< 768px) - Optimized untuk 360px */}
            <div className="md:hidden space-y-2.5">
              {members.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">Belum ada data member</div>
              ) : (
                members.map(m => <MemberCard key={m.id} member={m} />)
              )}
            </div>
          </>
        )}
      </div>

      {/* Detail Modal - Optimized untuk 360px */}
      {showDetail && selectedMember && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm" onClick={() => setShowDetail(false)}>
          <div className="bg-white w-full max-w-md rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            
            {/* Header Modal */}
            <div className="p-4 sm:p-6 text-center border-b bg-gray-50/50 relative">
              <button onClick={() => setShowDetail(false)} className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 text-gray-400 hover:bg-gray-200 rounded-full">
                <FiX className="w-4 h-4 sm:w-5 sm:h-5"/>
              </button>
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-4 border-primary-100 text-primary-600 flex items-center justify-center text-3xl sm:text-4xl font-bold mx-auto mb-3 sm:mb-4 shadow-sm">
                {getInitials(selectedMember.name)}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words px-2">{selectedMember.name}</h2>
              <div className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium mt-2 sm:mt-3 ${
                selectedMember.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {selectedMember.is_verified ? <FiCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> : <FiX className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>} 
                <span>{selectedMember.is_verified ? 'Terverifikasi' : 'Belum Verifikasi'}</span>
              </div>
            </div>

            {/* Info Details */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {/* Email */}
              <div className="bg-white border border-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-start gap-3 sm:gap-4 shadow-sm">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <FiMail className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="overflow-hidden min-w-0 flex-1">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-0.5">Email</p>
                  <p className="font-medium text-gray-900 text-sm sm:text-base break-words">{selectedMember.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-white border border-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-sm">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                  <FiPhone className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-0.5">Telepon</p>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">{selectedMember.phone || '-'}</p>
                </div>
              </div>

              {/* Address */}
              <div className="bg-white border border-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-start gap-3 sm:gap-4 shadow-sm">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <FiMapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-0.5">Alamat</p>
                  <p className="font-medium text-gray-900 text-sm sm:text-base leading-relaxed break-words">{selectedMember.address || '-'}</p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-6 bg-gray-50/50 border-t flex gap-2 sm:gap-3">
              <button 
                onClick={() => setShowDetail(false)} 
                className="flex-1 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
              <button 
                onClick={() => handleDelete(selectedMember.id)} 
                className="flex-1 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-red-700 flex items-center justify-center gap-1.5 sm:gap-2 transition-colors"
              >
                <FiTrash2 className="w-4 h-4"/> 
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;