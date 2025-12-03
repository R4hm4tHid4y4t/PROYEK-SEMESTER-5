const Account = require('../models/Account');

exports.createAccount = async (req, res) => {
  try {
    const { bank_name, account_number, account_holder } = req.body;
    const account = await Account.create({ bank_name, account_number, account_holder });
    res.status(201).json({ message: 'Rekening berhasil ditambahkan.', account });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.findAll();
    res.json({ accounts });
  } catch (error) {
    console.error('Get all accounts error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getActiveAccounts = async (req, res) => {
  try {
    const accounts = await Account.findAll(true);
    res.json({ accounts });
  } catch (error) {
    console.error('Get active accounts error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getAccountById = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Rekening tidak ditemukan.' });
    }
    res.json({ account });
  } catch (error) {
    console.error('Get account by id error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { bank_name, account_number, account_holder, is_active } = req.body;

    const existingAccount = await Account.findById(id);
    if (!existingAccount) {
      return res.status(404).json({ message: 'Rekening tidak ditemukan.' });
    }

    const account = await Account.update(id, { 
      bank_name, 
      account_number, 
      account_holder, 
      is_active: is_active === 'true' || is_active === true 
    });
    
    res.json({ message: 'Rekening berhasil diperbarui.', account });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Account.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Rekening tidak ditemukan.' });
    }

    res.json({ message: 'Rekening berhasil dihapus.' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.toggleAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await Account.toggleActive(id);
    
    if (!account) {
      return res.status(404).json({ message: 'Rekening tidak ditemukan.' });
    }

    res.json({ message: 'Status rekening berhasil diubah.', account });
  } catch (error) {
    console.error('Toggle account status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};
