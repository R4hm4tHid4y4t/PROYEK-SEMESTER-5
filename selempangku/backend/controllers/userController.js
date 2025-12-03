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

exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Member tidak ditemukan.' });
    }

    res.json({ message: 'Member berhasil dihapus.' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};
