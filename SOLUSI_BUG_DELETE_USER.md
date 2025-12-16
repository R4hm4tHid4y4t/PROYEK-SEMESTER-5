# Solusi: Bug Penghapusan User Menyebabkan History Pesanan & Pembayaran Hilang

**Status**: CRITICAL BUG  
**Priority**: HIGH  
**Date**: December 2025

---

## 📋 Ringkasan Masalah

Ketika admin menghapus akun user, **seluruh history pesanan (orders) dan pembayaran (payments)** user tersebut otomatis terhapus. Ini terjadi karena penggunaan `ON DELETE CASCADE` pada Foreign Key relationships di database.

### Root Cause:
1. **Database Constraint**: `ON DELETE CASCADE` pada `orders` dan `payments` table
2. **Model User.js**: Hard delete tanpa backup atau preservation
3. **Business Logic**: Tidak ada validasi untuk mempertahankan transaksi historis

---

## 🔧 Solusi Recommended: Soft Delete dengan Foreign Key Modification

### **Step 1: Update Database Schema**

#### 1.1 Tambahkan kolom `is_deleted` ke tabel `users`

```sql
ALTER TABLE `users` ADD COLUMN `is_deleted` TINYINT(1) DEFAULT 0;
ALTER TABLE `users` ADD COLUMN `deleted_at` DATETIME NULL;
```

#### 1.2 Ubah Foreign Key dari CASCADE menjadi SET NULL

```sql
-- Hentikan Foreign Key checks sementara
SET FOREIGN_KEY_CHECKS=0;

-- Hapus constraint lama
ALTER TABLE `orders` DROP FOREIGN KEY `orders_ibfk_1`;
ALTER TABLE `payments` DROP FOREIGN KEY `payments_ibfk_2`;

-- Tambahkan constraint baru
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` 
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_2` 
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Aktifkan kembali
SET FOREIGN_KEY_CHECKS=1;
```

#### 1.3 Buat index untuk performa query soft delete

```sql
ALTER TABLE `users` ADD INDEX `idx_is_deleted` (`is_deleted`);
ALTER TABLE `users` ADD INDEX `idx_deleted_at` (`deleted_at`);
```

---

### **Step 2: Update Model User.js**

**File**: `selempangku/backend/models/User.js`

Ubah method `delete()` untuk melakukan soft delete:

```javascript
static async delete(id) {
  const deletedAt = new Date();
  const [result] = await pool.execute(
    'UPDATE users SET is_deleted = 1, deleted_at = ? WHERE id = ? AND role = "user"', 
    [deletedAt, id]
  );
  return result.affectedRows > 0;
}

// Tambahkan method untuk permanent delete (hanya untuk admin tertentu jika perlu)
static async permanentDelete(id) {
  const [result] = await pool.execute(
    'DELETE FROM users WHERE id = ? AND role = "user"', 
    [id]
  );
  return result.affectedRows > 0;
}

// Update getAllMembers untuk exclude deleted users
static async getAllMembers() {
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, address, is_verified, created_at FROM users WHERE role = "user" AND is_deleted = 0 ORDER BY created_at DESC'
  );
  return rows;
}

// Tambahkan method untuk get deleted members (untuk audit)
static async getDeletedMembers() {
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, address, is_verified, created_at, deleted_at FROM users WHERE role = "user" AND is_deleted = 1 ORDER BY deleted_at DESC'
  );
  return rows;
}

// Tambahkan method untuk restore deleted user
static async restore(id) {
  const [result] = await pool.execute(
    'UPDATE users SET is_deleted = 0, deleted_at = NULL WHERE id = ? AND role = "user"', 
    [id]
  );
  return result.affectedRows > 0;
}

// Update findById untuk exclude deleted users
static async findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, address, role, is_verified, created_at FROM users WHERE id = ? AND is_deleted = 0', 
    [id]
  );
  return rows[0];
}

// Tambahkan method untuk findByIdIncludeDeleted (untuk admin)
static async findByIdIncludeDeleted(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, address, role, is_verified, is_deleted, deleted_at, created_at FROM users WHERE id = ?', 
    [id]
  );
  return rows[0];
}
```

---

### **Step 3: Update Controller untuk Handle Restore**

**File**: `selempangku/backend/controllers/userController.js`

Tambahkan endpoint untuk restore dan view deleted members:

```javascript
exports.getDeletedMembers = async (req, res) => {
  try {
    const members = await User.getDeletedMembers();
    res.json({ members });
  } catch (error) {
    console.error('Get deleted members error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

exports.restoreMember = async (req, res) => {
  try {
    const { id } = req.params;
    const restored = await User.restore(id);
    
    if (!restored) {
      return res.status(404).json({ message: 'Member tidak ditemukan.' });
    }

    res.json({ message: 'Member berhasil di-restore.' });
  } catch (error) {
    console.error('Restore member error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};
```

---

### **Step 4: Update Routes**

**File**: `selempangku/backend/routes/`

Tambahkan route untuk deleted members dan restore:

```javascript
// routes/userRoutes.js (atau sesuai struktur Anda)
router.get('/admin/members/deleted', authenticateToken, authorizeAdmin, userController.getDeletedMembers);
router.post('/admin/members/:id/restore', authenticateToken, authorizeAdmin, userController.restoreMember);
```

---

## 📊 Perbandingan Solusi

| Aspek | Hard Delete (Sebelumnya) | Soft Delete (Recommended) | Pure SET NULL |
|-------|--------------------------|---------------------------|----------------|
| **History Terjaga** | ❌ Hilang | ✅ Preserved | ✅ Preserved |
| **Data Integrity** | ⚠️ Cascade delete | ✅ Safe | ✅ Safe |
| **Restore Ability** | ❌ Tidak bisa | ✅ Bisa | ❌ Tidak bisa |
| **Audit Trail** | ❌ Tidak ada | ✅ Ada (deleted_at) | ⚠️ Terbatas |
| **Query Performance** | ✅ Cepat | ⚠️ Perlu filter | ✅ Cepat |
| **Complexity** | ✅ Sederhana | ⚠️ Kompleks | ✅ Sederhana |

---

## 🚀 Query Untuk Verifikasi Data

### Cek order yang kehilangan user reference:
```sql
SELECT o.*, u.name, u.email 
FROM orders o 
LEFT JOIN users u ON o.user_id = u.id 
WHERE o.user_id IS NULL;
```

### Cek payment yang kehilangan user reference:
```sql
SELECT p.*, u.name, u.email 
FROM payments p 
LEFT JOIN users u ON p.user_id = u.id 
WHERE p.user_id IS NULL;
```

### Lihat deleted users:
```sql
SELECT * FROM users WHERE is_deleted = 1;
```

---

## 📝 Migration Script

Jika ingin membuat migration yang terstruktur:

```javascript
// scripts/migration_soft_delete.js
const { pool } = require('../config/database');

async function migrateSoftDelete() {
  try {
    console.log('Starting migration...');
    
    // 1. Add columns
    await pool.execute(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted TINYINT(1) DEFAULT 0`
    );
    await pool.execute(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL`
    );
    
    // 2. Add indexes
    await pool.execute(
      `ALTER TABLE users ADD INDEX IF NOT EXISTS idx_is_deleted (is_deleted)`
    );
    await pool.execute(
      `ALTER TABLE users ADD INDEX IF NOT EXISTS idx_deleted_at (deleted_at)`
    );
    
    // 3. Modify Foreign Keys
    await pool.execute(`SET FOREIGN_KEY_CHECKS=0`);
    
    try {
      await pool.execute(`ALTER TABLE orders DROP FOREIGN KEY orders_ibfk_1`);
    } catch (e) {
      console.log('Constraint may not exist, continuing...');
    }
    
    try {
      await pool.execute(`ALTER TABLE payments DROP FOREIGN KEY payments_ibfk_2`);
    } catch (e) {
      console.log('Constraint may not exist, continuing...');
    }
    
    await pool.execute(
      `ALTER TABLE orders ADD CONSTRAINT orders_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`
    );
    
    await pool.execute(
      `ALTER TABLE payments ADD CONSTRAINT payments_ibfk_2 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`
    );
    
    await pool.execute(`SET FOREIGN_KEY_CHECKS=1`);
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateSoftDelete();
```

**Jalankan dengan**: `node scripts/migration_soft_delete.js`

---

## ✅ Checklist Implementasi

- [ ] Backup database sebelum melakukan perubahan
- [ ] Update database schema (Step 1)
- [ ] Update User.js model (Step 2)
- [ ] Update userController.js (Step 3)
- [ ] Update routes (Step 4)
- [ ] Test delete user functionality
- [ ] Verifikasi order & payment masih ada
- [ ] Test restore functionality
- [ ] Update frontend UI untuk menampilkan deleted members (optional)
- [ ] Deploy ke production

---

## 🔒 Security Considerations

1. **Authorization**: Pastikan hanya admin tertentu yang bisa delete/restore users
2. **Audit Logging**: Log siapa yang delete dan kapan
3. **Permanent Delete**: Batasi akses permanent delete hanya untuk super admin
4. **Data Privacy**: Pertimbangkan anonymization data personal jika diperlukan compliance

---

## 📞 Contact & Support

Untuk pertanyaan atau implementasi lebih lanjut, silakan buat issue di repository.
