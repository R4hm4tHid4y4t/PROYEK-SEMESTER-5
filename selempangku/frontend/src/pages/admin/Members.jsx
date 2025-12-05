import React, { useState, useEffect } from 'react';
import { FiTrash2, FiMail, FiPhone, FiCheck, FiX, FiSearch, FiFilter, FiUser, FiChevronRight, FiRefreshCw, FiMapPin, FiCalendar, FiUsers, FiCheckCircle, FiAlertCircle, FiChevronLeft } from 'react-icons/fi';
import { userService } from '../../services/api';
import { formatDateTime } from '../../utils/helpers';
import DataTable from '../../components/admin/DataTable';
import { toast } from 'react-toastify';
import { ResponsiveTableWrapper, ResponsiveGrid } from '../../components/common/ResponsiveLayout';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
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
      if (selectedMember?.id === id) {
        setSelectedMember(null);
        setShowDetailSheet(false);
      }
    } catch (error) {
      toast.error('Gagal menghapus member');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMembers.length === 0) return;
    if (!window.confirm(`Yakin ingin menghapus ${selectedMembers.length} member?`)) return;

    try {
      await Promise.all(selectedMembers.map(id => userService.deleteMember(id)));
      toast.success(`${selectedMembers.length} member berhasil dihapus`);
      setSelectedMembers([]);
      fetchMembers();
    } catch (error) {
      toast.error('Gagal menghapus beberapa member');
    }
  };

  const handleViewMember = (member) => {
    setSelectedMember(member);
    setShowDetailSheet(true);
  };

  const toggleSelectMember = (id) => {
    setSelectedMembers(prev =>
      prev.includes(id)
        ? prev.filter(m => m !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(m => m.id));
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'verified' && member.is_verified) ||
      (statusFilter === 'unverified' && !member.is_verified);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      header: () => (
        <input
          type="checkbox"
          checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
          onChange={toggleSelectAll}
          className="w-4 h-4"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedMembers.includes(row.id)}
          onChange={() => toggleSelectMember(row.id)}
          className="w-4 h-4"
        />
      )
    },
    {
      header: 'ID',
      render: (row) => <span className="font-medium">#{row.id}</span>
    },
    {
      header: 'Member',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium">
            {getInitials(row.name)}
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <FiMail className="w-3 h-3" /> {row.email}
            </p>
          </div>
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
        <span className="text-sm max-w-xs truncate block">{row.address || '-'}</span>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
          row.is_verified 
            ? 'bg-green-100 text-green-700' 
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {row.is_verified ? (
            <><FiCheck className="w-3 h-3" /> Verified</>
          ) : (
            <><FiX className="w-3 h-3" /> Unverified</>
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
        <div className="flex gap-2">
          <button
            onClick={() => handleViewMember(row)}
            className="min-w-[44px] min-h-[44px] p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center"
          >
            <FiUser className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="min-w-[44px] min-h-[44px] p-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      )
    }
  ];

  // Status Badge Component
  const StatusBadge = ({ verified, size = 'default' }) => {
    const baseClasses = 'inline-flex items-center gap-1 rounded-full font-medium';
    const sizeClasses = size === 'small' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
    
    return (
      <span className={`${baseClasses} ${sizeClasses} ${
        verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
      }`}>
        {verified ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
        <span className="hidden sm:inline">{verified ? 'Verified' : 'Unverified'}</span>
      </span>
    );
  };

  // Mobile Member Card
  const MemberCard = ({ member }) => (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-4 active:bg-gray-50 transition-colors min-h-[80px]"
      onClick={() => handleViewMember(member)}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-lg flex-shrink-0">
          {getInitials(member.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-base text-gray-900">{member.name}</p>
              <p className="text-sm text-gray-500 truncate">{member.email}</p>
            </div>
            <FiChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <StatusBadge verified={member.is_verified} size="small" />
            <span className="text-sm text-gray-400">{formatDateTime(member.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile Filter Bottom Sheet
  const FilterSheet = () => (
    <>
      {showFilters && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowFilters(false)}
        />
      )}
      <div className={`lg:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 transform transition-transform duration-300 ${
        showFilters ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="p-4 border-b">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Filter Member</h3>
            <button 
              onClick={() => setShowFilters(false)}
              className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 rounded-lg flex items-center justify-center"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          {[
            { value: 'all', label: 'Semua Member', icon: FiUsers },
            { value: 'verified', label: 'Verified', icon: FiCheckCircle },
            { value: 'unverified', label: 'Unverified', icon: FiAlertCircle }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => { setStatusFilter(option.value); setShowFilters(false); }}
              className={`w-full p-4 rounded-xl text-left flex items-center justify-between min-h-[56px] ${
                statusFilter === option.value ? 'bg-primary-50 border-2 border-primary-500' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <option.icon className="w-5 h-5" />
                <span className="font-medium">{option.label}</span>
              </div>
              {statusFilter === option.value && <FiCheck className="w-5 h-5 text-primary-600" />}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  // Mobile Detail Bottom Sheet
  const DetailSheet = () => {
    if (!selectedMember) return null;

    return (
      <>
        {showDetailSheet && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowDetailSheet(false)}
          />
        )}
        <div className={`lg:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 transform transition-transform duration-300 max-h-[85vh] overflow-hidden ${
          showDetailSheet ? 'translate-y-0' : 'translate-y-full'
        }`}>
          <div className="p-4 border-b sticky top-0 bg-white z-10">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Detail Member</h3>
              <button 
                onClick={() => setShowDetailSheet(false)}
                className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 rounded-lg flex items-center justify-center"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
            {/* Avatar Section */}
            <div className="flex flex-col items-center py-4">
              <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-2xl mb-3">
                {getInitials(selectedMember.name)}
              </div>
              <h4 className="font-semibold text-xl text-gray-900">{selectedMember.name}</h4>
              <StatusBadge verified={selectedMember.is_verified} />
            </div>

            {/* Info Cards */}
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FiMail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium break-all">{selectedMember.email}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <FiPhone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Telepon</p>
                  <p className="font-medium">{selectedMember.phone || '-'}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <FiMapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Alamat</p>
                  <p className="font-medium">{selectedMember.address || '-'}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <FiCalendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Terdaftar</p>
                  <p className="font-medium">{formatDateTime(selectedMember.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4">
              <button
                onClick={() => {
                  handleDelete(selectedMember.id);
                }}
                className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2 min-h-[48px]"
              >
                <FiTrash2 className="w-5 h-5" />
                Hapus Member
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Desktop Filter Sidebar
  const FilterSidebar = () => (
    <div className="hidden lg:block w-64 flex-shrink-0">
      <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4">
        <h3 className="font-semibold text-lg mb-4">Filter Status</h3>
        <div className="space-y-2">
          {[
            { value: 'all', label: 'Semua Member', count: members.length },
            { value: 'verified', label: 'Verified', count: members.filter(m => m.is_verified).length },
            { value: 'unverified', label: 'Unverified', count: members.filter(m => !m.is_verified).length }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`w-full p-3 rounded-lg text-left flex items-center justify-between transition-colors ${
                statusFilter === option.value ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
              }`}
            >
              <span>{option.label}</span>
              <span className="text-sm bg-gray-100 px-2 py-0.5 rounded-full">{option.count}</span>
            </button>
          ))}
        </div>

        {/* Bulk Actions */}
        {selectedMembers.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium text-sm text-gray-600 mb-3">Aksi Massal</h4>
            <p className="text-sm text-gray-500 mb-3">{selectedMembers.length} member dipilih</p>
            <button
              onClick={handleBulkDelete}
              className="w-full py-2 bg-red-50 text-red-600 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <FiTrash2 className="w-4 h-4" />
              Hapus Terpilih
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Desktop Modal
  const DesktopModal = () => {
    if (!selectedMember || !showDetailSheet) return null;

    return (
      <div className="hidden lg:flex fixed inset-0 bg-black/50 items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold">Detail Member</h2>
            <button 
              onClick={() => setShowDetailSheet(false)} 
              className="min-w-[44px] min-h-[44px] p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-2xl">
                {getInitials(selectedMember.name)}
              </div>
              <div>
                <h3 className="font-semibold text-xl">{selectedMember.name}</h3>
                <StatusBadge verified={selectedMember.is_verified} />
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{selectedMember.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Telepon</p>
                <p className="font-medium">{selectedMember.phone || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Alamat</p>
                <p className="font-medium">{selectedMember.address || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Terdaftar</p>
                <p className="font-medium">{formatDateTime(selectedMember.created_at)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => setShowDetailSheet(false)}
                className="flex-1 min-h-[44px] py-2.5 border border-gray-300 rounded-lg font-medium text-base hover:bg-gray-50"
              >
                Tutup
              </button>
              <button
                onClick={() => handleDelete(selectedMember.id)}
                className="flex-1 min-h-[44px] py-2.5 bg-red-600 text-white rounded-lg font-medium text-base hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <FiTrash2 className="w-5 h-5" />
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Pagination Component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2">
        {/* Mobile Pagination */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-3 rounded-xl bg-gray-100 disabled:opacity-50 min-w-[48px] min-h-[48px] flex items-center justify-center"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-3 rounded-xl bg-gray-100 disabled:opacity-50 min-w-[48px] min-h-[48px] flex items-center justify-center"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Pagination */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 rounded-lg font-medium ${
                currentPage === page
                  ? 'bg-primary-600 text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Kelola Member</h1>
        
        {/* Mobile Actions */}
        <div className="flex lg:hidden items-center gap-2">
          <button 
            onClick={() => setShowFilters(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 rounded-xl min-h-[48px]"
          >
            <FiFilter className="w-5 h-5" />
            <span className="capitalize">{statusFilter === 'all' ? 'Semua' : statusFilter}</span>
          </button>
          <button 
            onClick={fetchMembers}
            className="p-3 bg-gray-100 rounded-xl min-h-[48px] min-w-[48px] flex items-center justify-center"
          >
            <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field w-full pl-12 min-h-[48px] md:min-h-[44px]"
        />
      </div>

      {/* Stats Cards - Responsive */}
      <ResponsiveGrid cols={3} gap={4}>
        <div className="bg-white rounded-xl shadow-sm p-3 md:p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-xl md:text-2xl font-bold">{members.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 md:p-4">
          <p className="text-sm text-gray-500">Verified</p>
          <p className="text-xl md:text-2xl font-bold text-green-600">
            {members.filter(m => m.is_verified).length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 md:p-4">
          <p className="text-sm text-gray-500">Unverified</p>
          <p className="text-xl md:text-2xl font-bold text-yellow-600">
            {members.filter(m => !m.is_verified).length}
          </p>
        </div>
      </ResponsiveGrid>

      {/* Bulk Actions Bar - Mobile/Tablet */}
      {selectedMembers.length > 0 && (
        <div className="lg:hidden bg-primary-50 border border-primary-200 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-primary-700">
            {selectedMembers.length} member dipilih
          </span>
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <FiTrash2 className="w-4 h-4" />
            Hapus
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex gap-6">
        {/* Desktop Filter Sidebar */}
        <FilterSidebar />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada member</p>
            </div>
          ) : (
            <>
              {/* Mobile: Card List */}
              <div className="md:hidden space-y-3">
                {paginatedMembers.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>

              {/* Tablet: Table with horizontal scroll */}
              <div className="hidden md:block lg:hidden bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Member</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Telepon</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Terdaftar</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(member.id)}
                              onChange={() => toggleSelectMember(member.id)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium">
                                {getInitials(member.name)}
                              </div>
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-gray-500">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{member.phone || '-'}</td>
                          <td className="px-4 py-3">
                            <StatusBadge verified={member.is_verified} size="small" />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDateTime(member.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleViewMember(member)}
                                className="min-w-[44px] min-h-[44px] p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center"
                              >
                                <FiUser className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(member.id)}
                                className="min-w-[44px] min-h-[44px] p-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center"
                              >
                                <FiTrash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Desktop: Full Data Table */}
              <div className="hidden lg:block">
                <DataTable
                  columns={columns}
                  data={paginatedMembers}
                  loading={loading}
                  emptyMessage="Belum ada member"
                />
              </div>
            </>
          )}

          {/* Pagination */}
          <div className="mt-4">
            <Pagination />
          </div>
        </div>
      </div>

      {/* Member Count */}
      <div className="text-sm text-gray-500 text-center md:text-left">
        Menampilkan {paginatedMembers.length} dari {filteredMembers.length} member
      </div>

      {/* Mobile Bottom Sheets */}
      <FilterSheet />
      <DetailSheet />

      {/* Desktop Modal */}
      <DesktopModal />
    </div>
  );
};

export default Members;
