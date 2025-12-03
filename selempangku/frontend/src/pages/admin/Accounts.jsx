import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiX } from 'react-icons/fi';
import { accountService } from '../../services/api';
import DataTable from '../../components/admin/DataTable';
import { toast } from 'react-toastify';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
    account_holder: '',
    is_active: true
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await accountService.getAll();
      setAccounts(response.data.accounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast.error('Gagal memuat rekening');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const openModal = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        bank_name: account.bank_name,
        account_number: account.account_number,
        account_holder: account.account_holder,
        is_active: account.is_active
      });
    } else {
      setEditingAccount(null);
      setFormData({
        bank_name: '',
        account_number: '',
        account_holder: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAccount(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingAccount) {
        await accountService.update(editingAccount.id, formData);
        toast.success('Rekening berhasil diperbarui');
      } else {
        await accountService.create(formData);
        toast.success('Rekening berhasil ditambahkan');
      }

      closeModal();
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan rekening');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus rekening ini?')) return;

    try {
      await accountService.delete(id);
      toast.success('Rekening berhasil dihapus');
      fetchAccounts();
    } catch (error) {
      toast.error('Gagal menghapus rekening');
    }
  };

  const handleToggle = async (id) => {
    try {
      await accountService.toggle(id);
      toast.success('Status rekening diubah');
      fetchAccounts();
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  const columns = [
    {
      header: 'Bank',
      render: (row) => <span className="font-medium">{row.bank_name}</span>
    },
    {
      header: 'Nomor Rekening',
      render: (row) => <span className="font-mono">{row.account_number}</span>
    },
    {
      header: 'Atas Nama',
      accessor: 'account_holder'
    },
    {
      header: 'Status',
      render: (row) => (
        <button
          onClick={() => handleToggle(row.id)}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
            row.is_active 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {row.is_active ? (
            <><FiToggleRight className="w-5 h-5" /> Aktif</>
          ) : (
            <><FiToggleLeft className="w-5 h-5" /> Nonaktif</>
          )}
        </button>
      )
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openModal(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <FiEdit2 />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <FiTrash2 />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Rekening</h1>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <FiPlus /> Tambah Rekening
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex gap-4">
        <div className="px-4 py-2 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Total Rekening</p>
          <p className="text-2xl font-bold">{accounts.length}</p>
        </div>
        <div className="px-4 py-2 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-500">Aktif</p>
          <p className="text-2xl font-bold text-green-600">
            {accounts.filter(a => a.is_active).length}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={accounts}
        loading={loading}
        emptyMessage="Belum ada rekening"
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingAccount ? 'Edit Rekening' : 'Tambah Rekening'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
                <input
                  type="text"
                  name="bank_name"
                  required
                  value={formData.bank_name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Contoh: BCA, Mandiri, BNI"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  name="account_number"
                  required
                  value={formData.account_number}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Contoh: 1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Atas Nama</label>
                <input
                  type="text"
                  name="account_holder"
                  required
                  value={formData.account_holder}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nama pemilik rekening"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Rekening Aktif
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
