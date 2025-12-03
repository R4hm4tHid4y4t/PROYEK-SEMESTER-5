# SelempangKu - Sistem Informasi Pemesanan Selempang

Aplikasi web full-stack untuk pemesanan selempang online.

## Tech Stack

### Backend
- Node.js + Express.js
- MySQL2
- JWT Authentication
- Nodemailer (Email)
- Multer (File Upload)
- bcryptjs (Password Hashing)

### Frontend
- React.js 18
- React Router DOM
- Tailwind CSS
- Axios
- React Icons
- Recharts (Charts)
- React Toastify (Notifications)

## Prerequisites

- Node.js v18+
- MySQL 8.0+
- npm atau yarn

## Setup Database

1. Buat database MySQL:
```sql
CREATE DATABASE db_selempangku;
```

2. Import schema:
```bash
mysql -u root -p db_selempangku < database/schema.sql
```

## Setup Backend

1. Masuk ke folder backend:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
# Edit file .env sesuai konfigurasi Anda
cp .env.example .env
```

4. Jalankan server:
```bash
npm run dev    # Development mode
npm start      # Production mode
```

Server akan berjalan di `http://localhost:5000`

## Setup Frontend

1. Masuk ke folder frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
# Edit file .env jika diperlukan
```

4. Jalankan aplikasi:
```bash
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`

## Default Admin Login

- Email: `admin@selempangku.com`
- Password: `admin123`

## Fitur

### User
- Registrasi dengan verifikasi email OTP
- Login/Logout
- Lupa Password
- Lihat katalog produk
- Order produk
- Upload bukti pembayaran
- Lihat riwayat pesanan
- Update profil

### Admin
- Dashboard dengan statistik
- Kelola produk (CRUD)
- Kelola pesanan (update status)
- Verifikasi pembayaran
- Kelola member
- Kelola rekening bank
- Laporan penjualan dengan grafik

## Struktur Folder

```
selempangku/
├── backend/
│   ├── config/         # Konfigurasi database & email
│   ├── controllers/    # Logic controller
│   ├── middleware/     # Auth, upload, validation
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── uploads/        # Uploaded files
│   ├── .env
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── context/    # Auth context
│   │   ├── pages/      # User & Admin pages
│   │   ├── services/   # API services
│   │   ├── utils/      # Helper functions
│   │   ├── App.jsx
│   │   └── index.js
│   └── .env
└── database/
    └── schema.sql
```

## API Endpoints

### Auth
- POST `/api/auth/register` - Registrasi
- POST `/api/auth/verify-email` - Verifikasi OTP
- POST `/api/auth/login` - Login
- POST `/api/auth/forgot-password` - Lupa password
- POST `/api/auth/reset-password` - Reset password

### Products
- GET `/api/products/public` - List produk aktif
- GET `/api/products/:id` - Detail produk
- POST `/api/products` - Tambah produk (Admin)
- PUT `/api/products/:id` - Update produk (Admin)
- DELETE `/api/products/:id` - Hapus produk (Admin)

### Orders
- POST `/api/orders` - Buat pesanan
- GET `/api/orders/my-orders` - Pesanan user
- GET `/api/orders` - Semua pesanan (Admin)
- PUT `/api/orders/:id/status` - Update status (Admin)

### Payments
- POST `/api/payments` - Upload bukti bayar
- GET `/api/payments` - Semua pembayaran (Admin)
- PUT `/api/payments/:id/verify` - Verifikasi (Admin)
- PUT `/api/payments/:id/reject` - Tolak (Admin)

### Users
- GET `/api/users/profile` - Get profil
- PUT `/api/users/profile` - Update profil
- GET `/api/users/members` - List member (Admin)

### Accounts
- GET `/api/accounts/active` - Rekening aktif
- POST `/api/accounts` - Tambah rekening (Admin)
- PUT `/api/accounts/:id` - Update rekening (Admin)
- DELETE `/api/accounts/:id` - Hapus rekening (Admin)

### Reports
- GET `/api/reports/dashboard` - Dashboard stats (Admin)
- GET `/api/reports/sales` - Laporan penjualan (Admin)

## License

MIT License
