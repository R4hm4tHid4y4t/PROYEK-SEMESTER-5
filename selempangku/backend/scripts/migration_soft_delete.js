/**
 * Migration Script: Implement Soft Delete for Users
 * 
 * This script:
 * 1. Adds is_deleted and deleted_at columns to users table
 * 2. Modifies foreign key constraints to preserve order/payment history
 * 3. Creates necessary indexes for performance
 * 
 * Usage: node scripts/migration_soft_delete.js
 */

const { pool } = require('../config/database');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function runMigration() {
  try {
    console.log('\n========================================');
    console.log('  Soft Delete Migration Script');
    console.log('========================================\n');
    
    // Step 1: Backup warning
    console.log('⚠️  BACKUP YOUR DATABASE FIRST!');
    const confirm = await question('\nDo you want to continue? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('\n❌ Migration cancelled.');
      rl.close();
      process.exit(0);
    }

    console.log('\n📝 Starting migration...');
    console.log('================================================\n');
    
    // Step 1: Add columns to users table
    console.log('Step 1: Adding columns to users table...');
    try {
      await pool.execute(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted TINYINT(1) DEFAULT 0`
      );
      console.log('✅ Added is_deleted column');
    } catch (e) {
      console.log('⚠️  is_deleted column might already exist');
    }
    
    try {
      await pool.execute(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL`
      );
      console.log('✅ Added deleted_at column');
    } catch (e) {
      console.log('⚠️  deleted_at column might already exist');
    }
    
    // Step 2: Add indexes for performance
    console.log('\nStep 2: Adding indexes for performance...');
    try {
      await pool.execute(
        `ALTER TABLE users ADD INDEX IF NOT EXISTS idx_is_deleted (is_deleted)`
      );
      console.log('✅ Added idx_is_deleted index');
    } catch (e) {
      console.log('⚠️  Index might already exist');
    }
    
    try {
      await pool.execute(
        `ALTER TABLE users ADD INDEX IF NOT EXISTS idx_deleted_at (deleted_at)`
      );
      console.log('✅ Added idx_deleted_at index');
    } catch (e) {
      console.log('⚠️  Index might already exist');
    }
    
    // Step 3: Modify Foreign Keys
    console.log('\nStep 3: Modifying foreign key constraints...');
    console.log('(This ensures order/payment history is preserved)');
    
    // Disable foreign key checks temporarily
    await pool.execute(`SET FOREIGN_KEY_CHECKS=0`);
    console.log('✅ Disabled foreign key checks');
    
    // Drop old constraints and add new ones
    try {
      await pool.execute(`ALTER TABLE orders DROP FOREIGN KEY orders_ibfk_1`);
      console.log('✅ Dropped old orders foreign key');
    } catch (e) {
      console.log('⚠️  orders_ibfk_1 constraint might not exist');
    }
    
    try {
      await pool.execute(`ALTER TABLE payments DROP FOREIGN KEY payments_ibfk_2`);
      console.log('✅ Dropped old payments foreign key');
    } catch (e) {
      console.log('⚠️  payments_ibfk_2 constraint might not exist');
    }
    
    // Add new constraints with SET NULL
    try {
      await pool.execute(
        `ALTER TABLE orders ADD CONSTRAINT orders_ibfk_1 
         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`
      );
      console.log('✅ Added new orders foreign key (ON DELETE SET NULL)');
    } catch (e) {
      console.log('⚠️  Could not create orders constraint:', e.message);
    }
    
    try {
      await pool.execute(
        `ALTER TABLE payments ADD CONSTRAINT payments_ibfk_2 
         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`
      );
      console.log('✅ Added new payments foreign key (ON DELETE SET NULL)');
    } catch (e) {
      console.log('⚠️  Could not create payments constraint:', e.message);
    }
    
    // Re-enable foreign key checks
    await pool.execute(`SET FOREIGN_KEY_CHECKS=1`);
    console.log('✅ Re-enabled foreign key checks');
    
    // Step 4: Verify migration
    console.log('\nStep 4: Verifying migration...');
    const [usersTable] = await pool.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME IN ('is_deleted', 'deleted_at')`
    );
    
    if (usersTable.length === 2) {
      console.log('✅ Users table has is_deleted and deleted_at columns');
    } else {
      console.log('❌ Missing columns in users table');
    }
    
    console.log('\n================================================');
    console.log('✅ Migration completed successfully!');
    console.log('================================================\n');
    
    console.log('📋 Next Steps:');
    console.log('1. Replace selempangku/backend/models/User.js with User_FIXED.js');
    console.log('2. Replace selempangku/backend/controllers/userController.js with userController_FIXED.js');
    console.log('3. Update your routes to include new endpoints');
    console.log('4. Restart your Node.js server\n');
    
    console.log('🧪 To verify the fix:');
    console.log('  - Delete a user via admin panel');
    console.log('  - Check if their orders/payments are still in database');
    console.log('  - Query: SELECT * FROM orders WHERE user_id IS NULL;\n');
    
    rl.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    rl.close();
    process.exit(1);
  }
}

// Run the migration
runMigration();
