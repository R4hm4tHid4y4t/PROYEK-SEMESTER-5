-- ========================================
-- Migration SQL: Implement Soft Delete
-- ========================================
-- This script adds soft delete functionality
-- to preserve order and payment history
-- when users are deleted.
-- 
-- IMPORTANT: BACKUP YOUR DATABASE FIRST!
-- ========================================

-- Step 1: Add columns to users table
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `is_deleted` TINYINT(1) DEFAULT 0 AFTER `updated_at`;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL AFTER `is_deleted`;

-- Step 2: Add indexes for performance optimization
ALTER TABLE `users` ADD INDEX IF NOT EXISTS `idx_is_deleted` (`is_deleted`);
ALTER TABLE `users` ADD INDEX IF NOT EXISTS `idx_deleted_at` (`deleted_at`);

-- Step 3: Update Foreign Key Constraints
-- This is the critical part that preserves order/payment history
-- Instead of deleting related records (CASCADE), we set user_id to NULL

SET FOREIGN_KEY_CHECKS=0;

-- Drop old constraints
ALTER TABLE `orders` DROP FOREIGN KEY IF EXISTS `orders_ibfk_1`;
ALTER TABLE `payments` DROP FOREIGN KEY IF EXISTS `payments_ibfk_2`;

-- Add new constraints with ON DELETE SET NULL
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` 
  FOREIGN KEY (`user_id`) 
  REFERENCES `users` (`id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_2` 
  FOREIGN KEY (`user_id`) 
  REFERENCES `users` (`id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS=1;

-- Step 4: Verification queries
-- Run these after migration to verify everything is working

-- Check if columns were added
/*
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' 
AND COLUMN_NAME IN ('is_deleted', 'deleted_at');
*/

-- Check current foreign key constraints
/*
SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME IN ('orders', 'payments') 
AND COLUMN_NAME = 'user_id';
*/

-- Sample query to find orders from deleted users
/*
SELECT o.id, o.user_id, o.product_id, o.quantity, o.total_price, o.status, o.created_at 
FROM orders o 
WHERE o.user_id IS NULL 
ORDER BY o.created_at DESC;
*/
