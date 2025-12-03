export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

export const getStatusColor = (status) => {
  const statusColors = {
    'Menunggu Pembayaran': 'badge-pending',
    'Menunggu Verifikasi': 'badge-info',
    'Proses Produksi': 'badge-purple',
    'Dalam Pengiriman': 'badge-info',
    'Selesai': 'badge-success',
    'Ditolak': 'badge-danger',
    'Verifikasi': 'badge-success'
  };
  return statusColors[status] || 'badge-info';
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return '/placeholder-product.png';
  if (imagePath.startsWith('http')) return imagePath;
  return `${process.env.REACT_APP_API_URL?.replace('/api', '')}/uploads/products/${imagePath}`;
};

export const getPaymentProofUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${process.env.REACT_APP_API_URL?.replace('/api', '')}/uploads/payments/${imagePath}`;
};

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
  return re.test(phone.replace(/\s/g, ''));
};
