import React, { useState, useEffect } from 'react';
import { FiTrash2, FiMail, FiPhone, FiCheck, FiX } from 'react-icons/fi';
import { userService } from '../../services/api';
import { formatDateTime } from '../../utils/helpers';
import DataTable from '../../components/admin/DataTable';
import { toast } from 'react-toastify';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await userService.getMembers();
      setMembers(response.data.members);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Gagal memuat member');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus member ini?')) return;

    try {
      await userService.deleteMember(id);
      toast.success('Member berhasil dihapus');
      fetchMembers();
    } catch (error) {
      toast.error('Gagal menghapus member');
    }
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'ID',
      render: (row) => <span className="font-medium">#{row.id}</span>
    },
    {
      header: 'Nama',
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <FiMail className="w-3 h-3" /> {row.email}
          </p>
        </div>
      )
    },
    {
      header: 'Telepon',
      render: (row) => (
        <span className="flex items-center gap-1">
          <FiPhone className="w-4 h-4 text-gray-400" />
          {row.phone || '-'}
        </span>
      )
    },
    {
      header: 'Alamat',
      render: (row) => (
        <span className="text-sm">{row.address || '-'}</span>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`badge ${row.is_verified ? 'badge-success' : 'badge-pending'}`}>
          {row.is_verified ? (
            <><FiCheck className="w-3 h-3 mr-1" /> Verified</>
          ) : (
            <><FiX className="w-3 h-3 mr-1" /> Unverified</>
          )}
        </span>
      )
    },
    {
      header: 'Terdaftar',
      render: (row) => formatDateTime(row.created_at)
    },
    {
      header: 'Aksi',
      render: (row) => (
        <button
          onClick={() => handleDelete(row.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
        >
          <FiTrash2 />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Member</h1>
        <div className="flex gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="input-field w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex gap-4">
        <div className="px-4 py-2 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Total Member</p>
          <p className="text-2xl font-bold">{members.length}</p>
        </div>
        <div className="px-4 py-2 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-500">Verified</p>
          <p className="text-2xl font-bold text-green-600">
            {members.filter(m => m.is_verified).length}
          </p>
        </div>
        <div className="px-4 py-2 bg-yellow-50 rounded-lg">
          <p className="text-sm text-gray-500">Unverified</p>
          <p className="text-2xl font-bold text-yellow-600">
            {members.filter(m => !m.is_verified).length}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredMembers}
        loading={loading}
        emptyMessage="Belum ada member"
      />
    </div>
  );
};

export default Members;
