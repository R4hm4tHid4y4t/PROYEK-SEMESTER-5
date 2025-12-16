const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.updateProfile(req.user.id, { name, phone, address });
    res.json({ message: 'Profil berhasil diperbarui.', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findByEmail(req.user.email);
    const isMatch = await User.comparePassword(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Password saat ini salah.' });
    }

    await User.updatePassword(req.user.id, newPassword);
    res.json({ message: 'Password berhasil diubah.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getAllMembers = async (req, res) => {
  try {
    const members = await User.getAllMembers();
    res.json({ members });
  } catch (error) {
    console.error('Get all members error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

// Get deleted members for audit trail
exports.getDeletedMembers = async (req, res) => {
  try {
    const members = await User.getDeletedMembers();
    res.json({ members });
  } catch (error) {
    console.error('Get deleted members error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

// SOFT DELETE: Mark user as deleted
// This preserves all order and payment history
// History is preserved because:
// 1. User record is not deleted, just marked as deleted
// 2. Foreign key references remain intact
// 3. Order and Payment records can still reference deleted user
exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify the user exists and is not admin
    const user = await User.findByIdIncludeDeleted(id);
    if (!user) {
      return res.status(404).json({ message: 'Member tidak ditemukan.' });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Tidak dapat menghapus admin account.' });
    }
    
    // Perform soft delete
    const deleted = await User.delete(id);
    
    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus member.' });
    }

    res.json({ 
      message: 'Member berhasil dihapus. History pesanan dan pembayaran tetap tersimpan.',
      note: 'Data member dapat di-restore jika diperlukan.'
    });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

// RESTORE: Recover a soft-deleted user
// Only super admin can access this
exports.restoreMember = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify the user exists and is deleted
    const user = await User.findByIdIncludeDeleted(id);
    if (!user) {
      return res.status(404).json({ message: 'Member tidak ditemukan.' });
    }
    
    if (!user.is_deleted) {
      return res.status(400).json({ message: 'Member ini tidak dihapus.' });
    }
    
    // Restore the user
    const restored = await User.restore(id);
    
    if (!restored) {
      return res.status(400).json({ message: 'Gagal me-restore member.' });
    }

    res.json({ 
      message: 'Member berhasil di-restore.',
      user: await User.findById(id)
    });
  } catch (error) {
    console.error('Restore member error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

// PERMANENT DELETE: Only for super admin (dangerous operation)
// This should require additional confirmation
exports.permanentDeleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirm } = req.body;
    
    // Require explicit confirmation
    if (confirm !== 'DELETE_PERMANENTLY') {
      return res.status(400).json({ 
        message: 'Konfirmasi diperlukan untuk permanent delete.',
        instruction: 'Kirim confirm: "DELETE_PERMANENTLY" untuk melanjutkan'
      });
    }
    
    // Verify the user exists
    const user = await User.findByIdIncludeDeleted(id);
    if (!user) {
      return res.status(404).json({ message: 'Member tidak ditemukan.' });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Tidak dapat menghapus admin account secara permanen.' });
    }
    
    // Perform permanent delete - WARNING: This cannot be undone!
    const deleted = await User.permanentDelete(id);
    
    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus member.' });
    }

    // Log this action for security audit
    console.warn(`[SECURITY] Permanent user delete by admin: user_id=${id}, admin_id=${req.user.id}, timestamp=${new Date().toISOString()}`);

    res.json({ 
      message: 'Member berhasil dihapus secara permanen. Tindakan ini tidak dapat diundur.'
    });
  } catch (error) {
    console.error('Permanent delete member error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};
