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
      // Mengambil semua data member tanpa filter
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
      fetchMembers(); // Refresh data
      setShowDetail(false);
    } catch (error) {
      toast.error('Gagal menghapus member');
    }
  };

  const getInitials = (name) => name?.substring(0, 2).toUpperCase() || 'U';

  // --- DEFINISI KOLOM TABEL DESKTOP ---
  const columns = [
    {
      header: 'Member',
      render: (row) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold shadow-sm">
            {getInitials(row.name)}
          </div>
          <div>
            <p className="font-bold text-gray-900">{row.name}</p>
            <p className="text-sm text-gray-500 font-medium">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Status Akun',
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
      header: 'Tanggal Bergabung',
      render: (row) => <span className="text-sm font-medium text-gray-600">{formatDateTime(row.created_at)}</span>
    },
    {
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => { setSelectedMember(row); setShowDetail(true); }}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Lihat Detail"
          >
            <FiUser className="w-5 h-5" />
          </button>
          <button 
            onClick={() => handleDelete(row.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus Member"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Simplified */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Data Member</h1>
            <p className="text-sm text-gray-500 mt-1">Total {members.length} pengguna terdaftar.</p>
        </div>
        <button 
            onClick={fetchMembers} 
            disabled={loading}
            className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-primary-600 transition-colors shadow-sm"
            title="Refresh Data"
        >
            <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="min-h-[400px]">
        {loading ? (
             <div className="flex items-center justify-center h-64">
             <Loader />
          </div>
        ) : (
            <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <DataTable columns={columns} data={members} loading={loading} emptyMessage="Belum ada data member." />
                </div>

                {/* Mobile List View */}
                <div className="md:hidden space-y-3">
                {members.map(m => (
                    <div key={m.id} onClick={() => { setSelectedMember(m); setShowDetail(true); }} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm active:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                                {getInitials(m.name)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-gray-900 truncate text-base">{m.name}</p>
                                <p className="text-sm text-gray-500 truncate">{m.email}</p>
                            </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${m.is_verified ? 'bg-green-500 ring-2 ring-green-100' : 'bg-yellow-500 ring-2 ring-yellow-100'}`} title={m.is_verified ? 'Verified' : 'Unverified'} />
                    </div>
                ))}
                </div>
            </>
        )}
      </div>

      {/* Detail Modal (Responsive) */}
      {(showDetail && selectedMember) && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowDetail(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            
            <div className="p-6 text-center border-b border-gray-100 bg-gray-50/50 relative">
                <button onClick={() => setShowDetail(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors"><FiX className="w-5 h-5"/></button>
                <div className="w-24 h-24 rounded-full bg-white border-4 border-primary-100 text-primary-600 flex items-center justify-center text-4xl font-bold mx-auto mb-4 shadow-sm">
                {getInitials(selectedMember.name)}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedMember.name}</h2>
                <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium mt-3 ${selectedMember.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {selectedMember.is_verified ? <FiCheck className="w-4 h-4"/> : <FiX className="w-4 h-4"/>} 
                <span>{selectedMember.is_verified ? 'Akun Terverifikasi' : 'Belum Verifikasi'}</span>
                </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><FiMail className="w-5 h-5" /></div>
                <div className="overflow-hidden"><p className="text-xs text-gray-500 uppercase font-medium mb-0.5">Email</p><p className="font-medium text-gray-900 truncate">{selectedMember.email}</p></div>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0"><FiPhone className="w-5 h-5" /></div>
                <div><p className="text-xs text-gray-500 uppercase font-medium mb-0.5">Telepon</p><p className="font-medium text-gray-900">{selectedMember.phone || '-'}</p></div>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0"><FiMapPin className="w-5 h-5" /></div>
                <div><p className="text-xs text-gray-500 uppercase font-medium mb-0.5">Alamat</p><p className="font-medium text-gray-900 leading-relaxed">{selectedMember.address || '-'}</p></div>
              </div>
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
               <button onClick={() => setShowDetail(false)} className="flex-1 btn-secondary bg-white py-3 font-medium">Tutup</button>
               <button onClick={() => handleDelete(selectedMember.id)} className="flex-1 btn-danger py-3 font-medium flex items-center justify-center gap-2"><FiTrash2/> Hapus Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;