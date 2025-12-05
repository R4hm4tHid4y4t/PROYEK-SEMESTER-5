import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiX, FiCreditCard, FiMoreVertical } from 'react-icons/fi';
import { accountService } from '../../services/api';
import DataTable from '../../components/admin/DataTable';
import { toast } from 'react-toastify';
import { ResponsiveGrid } from '../../components/common/ResponsiveLayout';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
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
    setShowActionMenu(null);
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
    setShowActionMenu(null);
  };

  const handleToggle = async (id) => {
    try {
      await accountService.toggle(id);
      toast.success('Status rekening diubah');
      fetchAccounts();
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
    setShowActionMenu(null);
  };

  // Desktop columns (1024px+)
  const desktopColumns = [
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
      render: (row) => <span>{row.account_holder}</span>
    },
    {
      header: 'Status',
      render: (row) => (
        <button
          onClick={() => handleToggle(row.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
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
        <div className="flex gap-1">
          <button onClick={() => openModal(row)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
            <FiEdit2 className="w-5 h-5" />
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      )
    }
  ];

  // Tablet columns (768px - 1023px) - More compact
  const tabletColumns = [
    {
      header: 'Rekening',
      render: (row) => (
        <div>
          <p className="font-semibold text-sm">{row.bank_name}</p>
          <p className="font-mono text-xs text-gray-600">{row.account_number}</p>
          <p className="text-xs text-gray-500">a.n. {row.account_holder}</p>
        </div>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <button
          onClick={() => handleToggle(row.id)}
          className={`px-2 py-1 rounded-lg text-xs font-medium ${
            row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {row.is_active ? 'Aktif' : 'Nonaktif'}
        </button>
      )
    },
    {
      header: '',
      render: (row) => (
        <div className="flex gap-1">
          <button onClick={() => openModal(row)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const AccountCard = ({ account }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <FiCreditCard className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold">{account.bank_name}</h3>
            <p className="font-mono text-sm text-gray-600">{account.account_number}</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowActionMenu(showActionMenu === account.id ? null : account.id)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <FiMoreVertical className="w-5 h-5" />
          </button>
          {showActionMenu === account.id && (
            <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[140px]">
              <button
                onClick={() => openModal(account)}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <FiEdit2 className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => handleToggle(account.id)}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                {account.is_active ? <FiToggleLeft className="w-4 h-4" /> : <FiToggleRight className="w-4 h-4" />}
                {account.is_active ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
              <button
                onClick={() => handleDelete(account.id)}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <FiTrash2 className="w-4 h-4" /> Hapus
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-3">a.n. {account.account_holder}</p>
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
        account.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
      }`}>
        {account.is_active ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
        {account.is_active ? 'Aktif' : 'Nonaktif'}
      </span>
    </div>
  );

  const AccountModal = () => (
    <div className="fixed inset-0 z-50">
      <div className="hidden md:block absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
      
      <div className="absolute inset-0 md:flex md:items-center md:justify-center md:p-4">
        <div className="bg-white w-full h-full md:h-auto md:rounded-xl md:max-w-md overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <FiCreditCard className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-semibold">
                {editingAccount ? 'Edit Rekening' : 'Tambah Rekening'}
              </h2>
            </div>
            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Bank</label>
                <input
                  type="text"
                  name="bank_name"
                  required
                  value={formData.bank_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Contoh: BCA, Mandiri, BNI"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Rekening</label>
                <input
                  type="text"
                  name="account_number"
                  required
                  value={formData.account_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Contoh: 1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Atas Nama</label>
                <input
                  type="text"
                  name="account_holder"
                  required
                  value={formData.account_holder}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Nama pemilik rekening"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <label htmlFor="is_active" className="font-medium text-gray-700">
                  Rekening Aktif
                </label>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button 
                type="button" 
                onClick={closeModal} 
                className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={submitting} 
                className="flex-1 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Kelola Rekening</h1>
          <p className="text-sm text-gray-500">{accounts.length} rekening terdaftar</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="hidden md:flex px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 items-center gap-2"
        >
          <FiPlus className="w-5 h-5" /> Tambah
        </button>
      </div>

      {/* Stats */}
      <ResponsiveGrid cols={2} gap={4}>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Rekening</p>
          <p className="text-2xl font-bold">{accounts.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-gray-500">Aktif</p>
          <p className="text-2xl font-bold text-green-600">
            {accounts.filter(a => a.is_active).length}
          </p>
        </div>
      </ResponsiveGrid>

      {/* Mobile: Card List */}
      <div className="md:hidden space-y-3">
        {accounts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <FiCreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada rekening</p>
          </div>
        ) : (
          accounts.map((account) => <AccountCard key={account.id} account={account} />)
        )}
      </div>

      {/* Desktop: Table (1024px+) */}
      <div className="hidden lg:block">
        <DataTable columns={desktopColumns} data={accounts} loading={loading} emptyMessage="Belum ada rekening" />
      </div>

      {/* Tablet: Compact Table (768px - 1023px) */}
      <div className="hidden md:block lg:hidden">
        <DataTable columns={tabletColumns} data={accounts} loading={loading} emptyMessage="Belum ada rekening" />
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => openModal()}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 flex items-center justify-center z-30"
      >
        <FiPlus className="w-6 h-6" />
      </button>

      {showModal && <AccountModal />}
    </div>
  );
};

export default Accounts;