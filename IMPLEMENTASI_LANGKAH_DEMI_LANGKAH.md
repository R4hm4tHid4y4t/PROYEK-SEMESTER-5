# Panduan Implementasi: Fix Bug Penghapusan User

## 📋 Ringkasan

Bug ini menyebabkan data pesanan (orders) dan pembayaran (payments) hilang saat user dihapus oleh admin. Solusi menggunakan **Soft Delete** untuk menjaga integritas data.

---

## 🚀 Langkah Implementasi

### **LANGKAH 1: BACKUP DATABASE** ⚠️

**PENTING**: Backup database Anda sebelum melakukan perubahan!

```bash
# Jika menggunakan MySQL/MariaDB
mysqldump -u root -p db_selempangku > backup_db_selempangku_$(date +%Y%m%d_%H%M%S).sql

# Atau gunakan phpMyAdmin untuk backup
```

---

### **LANGKAH 2: Update Database Schema**

#### Opsi A: Gunakan Script Migration (RECOMMENDED)

```bash
cd selempangku/backend
node scripts/migration_soft_delete.js
```

**Proses akan:**
- ✅ Menambah kolom `is_deleted` dan `deleted_at` ke tabel `users`
- ✅ Membuat index untuk optimasi performa
- ✅ Mengubah foreign key dari `CASCADE` menjadi `SET NULL`
- ✅ Memverifikasi semua perubahan

#### Opsi B: Jalankan SQL Manual

Buka phpMyAdmin atau MySQL client Anda dan jalankan:

```sql
-- Copy-paste semua isi dari: selempangku/database/migration_soft_delete.sql
```

---

### **LANGKAH 3: Update Backend Files**

#### 3.1 Update User Model

**Ganti file**: `selempangku/backend/models/User.js`

**Dengan isi dari**: `selempangku/backend/models/User_FIXED.js`

**Yang berubah:**
- Ubah `delete()` menjadi soft delete (mengupdate `is_deleted = 1`)
- Tambah `restore()` untuk restore user yang dihapus
- Ubah query untuk exclude deleted users

```javascript
// Sebelumnya (HARD DELETE - PROBLEM):
static async delete(id) {
  const [result] = await pool.execute(
    'DELETE FROM users WHERE id = ? AND role = "user"', 
    [id]
  );
  return result.affectedRows > 0;
}

// Sesudahnya (SOFT DELETE - SOLUTION):
static async delete(id) {
  const deletedAt = new Date();
  const [result] = await pool.execute(
    'UPDATE users SET is_deleted = 1, deleted_at = ? WHERE id = ? AND role = "user"',
    [deletedAt, id]
  );
  return result.affectedRows > 0;
}
```

#### 3.2 Update User Controller

**Ganti file**: `selempangku/backend/controllers/userController.js`

**Dengan isi dari**: `selempangku/backend/controllers/userController_FIXED.js`

**Yang ditambah:**
- `getDeletedMembers()` - Lihat daftar user yang dihapus
- `restoreMember()` - Restore user yang dihapus
- `permanentDeleteMember()` - Permanent delete (dengan konfirmasi)
- Enhanced error handling

---

### **LANGKAH 4: Update Routes (Jika Belum Ada)**

**Edit file routes Anda** (misal: `routes/userRoutes.js` atau `routes/admin.js`)

Tambahkan endpoint baru:

```javascript
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// Existing endpoints...

// DELETE USER (soft delete)
router.delete('/admin/members/:id', authenticateToken, authorizeAdmin, userController.deleteMember);

// VIEW DELETED MEMBERS
router.get('/admin/members/deleted', authenticateToken, authorizeAdmin, userController.getDeletedMembers);

// RESTORE USER
router.post('/admin/members/:id/restore', authenticateToken, authorizeAdmin, userController.restoreMember);

// PERMANENT DELETE (hanya untuk super admin)
router.delete('/admin/members/:id/permanent', authenticateToken, authorizeAdmin, userController.permanentDeleteMember);

module.exports = router;
```

---

### **LANGKAH 5: Restart Server**

```bash
cd selempangku/backend

# Stop server saat ini (Ctrl + C)

# Jalankan ulang
node server.js

# Atau jika menggunakan nodemon
npm run dev
```

---

## 🧪 Test & Verifikasi

### **Test 1: Delete User & Verifikasi History Tetap Ada**

1. Login sebagai admin
2. Buka halaman Member Management
3. Pilih salah satu user dan delete
4. Lihat response: "Member berhasil dihapus. History pesanan dan pembayaran tetap tersimpan."
5. Jalankan query di database:

```sql
-- Cek deleted user
SELECT * FROM users WHERE is_deleted = 1;

-- Cek orders masih ada (user_id jadi NULL untuk deleted users)
SELECT * FROM orders WHERE user_id IS NULL;

-- Cek payments masih ada
SELECT * FROM payments WHERE user_id IS NULL;
```

**Expected Result**: ✅ Data orders & payments masih ada

### **Test 2: Restore User**

1. Call endpoint: `POST /admin/members/{userId}/restore`
2. Verifikasi user muncul di daftar members lagi
3. Orders & payments sudah ter-link ulang ke user

```sql
-- Verifikasi
SELECT * FROM users WHERE id = {userId}; -- is_deleted = 0
SELECT * FROM orders WHERE user_id = {userId}; -- Data ada
```

### **Test 3: Query Active Users (Without Deleted)**

```sql
-- Query yang sudah ter-update di User.js
SELECT id, name, email FROM users WHERE is_deleted = 0;
```

**Expected Result**: ✅ Hanya user yang tidak dihapus yang ditampilkan

---

## 📊 Perbandingan Sebelum & Sesudah

### SEBELUMNYA (BUG):
```
Admin delete user ID = 5
        ↓
DELETE FROM users WHERE id = 5
        ↓
Foreign Key CASCADE DELETE triggered
        ↓
Semua orders WHERE user_id = 5 DELETED ❌
Semua payments WHERE user_id = 5 DELETED ❌
        ↓
DATA HILANG SELAMANYA
```

### SESUDAHNYA (FIX):
```
Admin delete user ID = 5
        ↓
UPDATE users SET is_deleted = 1 WHERE id = 5
        ↓
Foreign Key SET NULL triggered
        ↓
Orders: user_id = NULL (tapi data tetap ada) ✅
Payments: user_id = NULL (tapi data tetap ada) ✅
        ↓
ADMIN BISA RESTORE ANYTIME ✅
HISTORY TETAP PRESERVED ✅
```

---

## 📝 Database Changes Summary

```sql
-- Tabel users sebelum:
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  password VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Tabel users sesudah:
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  password VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,        -- NEW!
  deleted_at DATETIME NULL                 -- NEW!
);
```

**Foreign Keys:**
```sql
-- Sebelumnya:
ALTER TABLE orders 
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE; -- ❌ PROBLEM

-- Sesudahnya:
ALTER TABLE orders 
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL; -- ✅ SOLUTION
```

---

## 🐛 Troubleshooting

### **Error: "Cannot delete or update a parent row"**

**Penyebab**: Foreign key constraints tidak ter-update

**Solusi**:
```bash
node selempangku/backend/scripts/migration_soft_delete.js
```

### **Orders/Payments masih hilang setelah delete user**

**Penyebab**: File model/controller belum diganti

**Solusi**:
1. Pastikan `User_FIXED.js` sudah mereplace `User.js`
2. Pastikan `userController_FIXED.js` sudah mereplace `userController.js`
3. Restart server

### **User tidak muncul di list member setelah restore**

**Penyebab**: Query memfilter `is_deleted = 0`

**Verifikasi**:
```sql
-- Check database langsung
SELECT * FROM users WHERE id = {userId};
-- Pastikan is_deleted = 0
```

---

## 📚 Referensi File

**Di branch**: `fix/user-deletion-history-preservation`

- 📄 `SOLUSI_BUG_DELETE_USER.md` - Penjelasan teknis lengkap
- 📄 `selempangku/backend/models/User_FIXED.js` - Model user yang sudah fixed
- 📄 `selempangku/backend/controllers/userController_FIXED.js` - Controller yang sudah fixed
- 📄 `selempangku/backend/scripts/migration_soft_delete.js` - Script migration otomatis
- 📄 `selempangku/database/migration_soft_delete.sql` - SQL migration manual

---

## ✅ Checklist Implementasi

- [ ] Backup database ✓
- [ ] Jalankan migration script atau SQL
- [ ] Update User.js model
- [ ] Update userController.js
- [ ] Update routes (jika belum ada)
- [ ] Restart backend server
- [ ] Test delete user
- [ ] Verifikasi data tetap ada
- [ ] Test restore user
- [ ] Commit & push ke repository
- [ ] Deploy ke production (optional)

---

## 🎯 Kesimpulan

Dengan implementasi soft delete ini:

✅ **History pesanan dan pembayaran tetap tersimpan** saat user dihapus  
✅ **Admin dapat melihat user yang dihapus** (audit trail)  
✅ **Admin dapat restore user** jika diperlukan  
✅ **Data integrity terjaga** dengan foreign key yang tepat  
✅ **Business continuity** terjamin  

---

## 📧 Support

Jika ada pertanyaan atau mengalami masalah:
1. Baca `SOLUSI_BUG_DELETE_USER.md`
2. Cek error message di server logs
3. Verifikasi database struktur
4. Buat issue di GitHub dengan error log

**Happy coding! 🚀**
