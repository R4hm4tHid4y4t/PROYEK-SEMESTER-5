const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    };
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return false;
  }
};

const sendOTPEmail = async (to, otp, name) => {
  const subject = 'Verifikasi Email - SelempangKu';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">SelempangKu</h2>
      <p>Halo ${name},</p>
      <p>Terima kasih telah mendaftar di SelempangKu. Gunakan kode OTP berikut untuk memverifikasi email Anda:</p>
      <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #4F46E5; letter-spacing: 5px; margin: 0;">${otp}</h1>
      </div>
      <p>Kode ini berlaku selama 5 menit.</p>
      <p>Jika Anda tidak melakukan pendaftaran, abaikan email ini.</p>
      <p>Salam,<br>Tim SelempangKu</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

const sendResetPasswordEmail = async (to, resetLink, name) => {
  const subject = 'Reset Password - SelempangKu';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">SelempangKu</h2>
      <p>Halo ${name},</p>
      <p>Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah untuk melanjutkan:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      </div>
      <p>Link ini berlaku selama 1 jam.</p>
      <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
      <p>Salam,<br>Tim SelempangKu</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

const sendOrderConfirmationEmail = async (to, order, name) => {
  const subject = 'Konfirmasi Pesanan - SelempangKu';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">SelempangKu</h2>
      <p>Halo ${name},</p>
      <p>Pesanan Anda telah berhasil dibuat. Berikut detail pesanan:</p>
      <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0;">
        <p><strong>No. Pesanan:</strong> ${order.id}</p>
        <p><strong>Produk:</strong> ${order.product_name}</p>
        <p><strong>Jumlah:</strong> ${order.quantity}</p>
        <p><strong>Total:</strong> Rp ${order.total_price.toLocaleString('id-ID')}</p>
      </div>
      <p>Silakan lakukan pembayaran untuk melanjutkan proses pesanan.</p>
      <p>Salam,<br>Tim SelempangKu</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

const sendPaymentStatusEmail = async (to, status, order, name, notes = '') => {
  const isApproved = status === 'Verifikasi';
  const subject = isApproved ? 'Pembayaran Diverifikasi - SelempangKu' : 'Pembayaran Ditolak - SelempangKu';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">SelempangKu</h2>
      <p>Halo ${name},</p>
      ${isApproved ? `
        <p>Pembayaran Anda untuk pesanan #${order.id} telah diverifikasi.</p>
        <p>Pesanan Anda sedang dalam proses produksi.</p>
      ` : `
        <p>Maaf, pembayaran Anda untuk pesanan #${order.id} ditolak.</p>
        ${notes ? `<p><strong>Alasan:</strong> ${notes}</p>` : ''}
        <p>Silakan upload ulang bukti pembayaran yang valid.</p>
      `}
      <p>Salam,<br>Tim SelempangKu</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

const sendOrderStatusEmail = async (to, status, order, name) => {
  const subject = `Update Status Pesanan - SelempangKu`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">SelempangKu</h2>
      <p>Halo ${name},</p>
      <p>Status pesanan Anda #${order.id} telah diperbarui menjadi: <strong>${status}</strong></p>
      <p>Salam,<br>Tim SelempangKu</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendResetPasswordEmail,
  sendOrderConfirmationEmail,
  sendPaymentStatusEmail,
  sendOrderStatusEmail
};
