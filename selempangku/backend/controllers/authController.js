const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTPEmail, sendResetPasswordEmail } = require('../config/email');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }

    const { id, otp } = await User.create({ name, email, password, phone, address });
    await sendOTPEmail(email, otp, name);

    res.status(201).json({
      message: 'Registrasi berhasil. Silakan cek email untuk verifikasi.',
      email
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const verified = await User.verifyOTP(email, otp);
    if (!verified) {
      return res.status(400).json({ message: 'OTP tidak valid atau sudah kadaluarsa.' });
    }

    res.json({ message: 'Email berhasil diverifikasi. Silakan login.' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Email tidak ditemukan.' });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: 'Email sudah diverifikasi.' });
    }

    const otp = await User.updateOTP(email);
    await sendOTPEmail(email, otp, user.name);

    res.json({ message: 'OTP baru telah dikirim ke email Anda.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ 
        message: 'Email belum diverifikasi. Silakan verifikasi email Anda.',
        needVerification: true,
        email: user.email
      });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Email tidak ditemukan.' });
    }

    const resetToken = await User.setResetToken(email);
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendResetPasswordEmail(email, resetLink, user.name);

    res.json({ message: 'Link reset password telah dikirim ke email Anda.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findByResetToken(token);
    if (!user) {
      return res.status(400).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
    }

    await User.resetPassword(token, password);
    res.json({ message: 'Password berhasil direset. Silakan login dengan password baru.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};
