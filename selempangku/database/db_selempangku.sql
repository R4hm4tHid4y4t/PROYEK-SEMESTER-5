-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Dec 03, 2025 at 01:47 PM
-- Server version: 5.7.39
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_selempangku`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` int(11) NOT NULL,
  `bank_name` varchar(50) NOT NULL,
  `account_number` varchar(50) NOT NULL,
  `account_holder` varchar(100) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`id`, `bank_name`, `account_number`, `account_holder`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'BCA', '1234567890', 'PT SelempangKu Indonesia', 1, '2025-12-02 12:34:44', '2025-12-03 11:48:29'),
(2, 'Mandiri', '0987654321', 'PT SelempangKu Indonesia', 1, '2025-12-02 12:34:44', '2025-12-03 00:56:11'),
(3, 'BNI', '5678901234', 'PT SelempangKu Indonesia', 1, '2025-12-02 12:34:44', '2025-12-02 12:34:44');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `notes` text,
  `status` enum('Menunggu Pembayaran','Menunggu Verifikasi','Proses Produksi','Dalam Pengiriman','Selesai','Ditolak') DEFAULT 'Menunggu Pembayaran',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `product_id`, `quantity`, `total_price`, `notes`, `status`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 3, '225000.00', 'Warna Merah', 'Selesai', '2025-12-03 00:46:04', '2025-12-03 04:41:39'),
(2, 2, 1, 1, '75000.00', 'Warna merah', 'Selesai', '2025-12-03 04:33:43', '2025-12-03 04:41:33'),
(3, 2, 2, 1, '50000.00', 'SMAN 3 PARIAMAN, 2023, ', 'Proses Produksi', '2025-12-03 11:45:07', '2025-12-03 11:49:59');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_proof` varchar(255) DEFAULT NULL,
  `status` enum('Menunggu Verifikasi','Verifikasi','Ditolak') DEFAULT 'Menunggu Verifikasi',
  `verification_notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `user_id`, `account_id`, `amount`, `payment_proof`, `status`, `verification_notes`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 1, '225000.00', 'payment-1764722825402-899438789.pdf', 'Verifikasi', NULL, '2025-12-03 00:47:05', '2025-12-03 04:36:25'),
(2, 2, 2, 1, '75000.00', 'payment-1764736450244-79291929.jpg', 'Verifikasi', NULL, '2025-12-03 04:34:10', '2025-12-03 04:36:16'),
(3, 3, 2, 1, '50000.00', 'payment-1764762322239-838332473.jpeg', 'Verifikasi', NULL, '2025-12-03 11:45:22', '2025-12-03 11:45:59');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `stock` int(11) DEFAULT '0',
  `category` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `price`, `image`, `stock`, `category`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Selempang Wisuda Lulusan Terbaik', 'Selempang wisuda dengan bahan bludru', '75000.00', 'product-1764760942068-299328204.jpeg', 96, 'Wisuda', 1, '2025-12-02 12:34:44', '2025-12-03 11:22:46'),
(2, 'Selempang Peringkat 1', 'Selempang juara dengan bordir emas (bludru)\r\n', '50000.00', 'product-1764760712346-627773247.jpeg', 49, 'Sekolah', 1, '2025-12-02 12:34:44', '2025-12-03 11:45:07'),
(4, 'Selempang Custom', 'Selempang custom sesuai keinginan', '100000.00', 'product-1764761156322-903838401.jpeg', 50, 'Custom', 1, '2025-12-02 12:34:44', '2025-12-03 11:25:56');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `role` enum('user','admin') DEFAULT 'user',
  `is_verified` tinyint(1) DEFAULT '0',
  `otp_code` varchar(6) DEFAULT NULL,
  `otp_expiry` datetime DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `address`, `role`, `is_verified`, `otp_code`, `otp_expiry`, `reset_token`, `reset_token_expiry`, `created_at`, `updated_at`) VALUES
(2, 'Rahmat Hidayat', 'rh6479458@gmail.com', '$2a$10$AEo4ynOT.gPdkBiEyziGN.O0LAo2Sa05XUOtTACdrk9f0jSxObOjK', '081374777302', 'Jl.Abdullah, Dusun Tebing Hilir, Desa Air Santok, Kec. Pariaman Timur, Kota Pariaman, Prov. Sumatera Barat', 'user', 1, NULL, NULL, NULL, NULL, '2025-12-03 00:31:53', '2025-12-03 00:54:02'),
(3, 'Rahmat Hidayat', 'rahmatrahmat2307@gmail.com', '$2a$10$4Lvvy2hudzZS1zXeD/iJO.XQWM7PBq//WpiRv/tZaFnCbrWgLntha', '081374777302', 'Jl.Abdullah, Dusun Tebing Hilir, Desa Air Santok, Kec. Pariaman Timur, Kota Pariaman, Prov. Sumatera Barat', 'admin', 1, NULL, NULL, NULL, NULL, '2025-12-03 00:50:18', '2025-12-03 00:51:31');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `idx_orders_user_id` (`user_id`),
  ADD KEY `idx_orders_status` (`status`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `account_id` (`account_id`),
  ADD KEY `idx_payments_order_id` (`order_id`),
  ADD KEY `idx_payments_status` (`status`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_products_category` (`category`),
  ADD KEY `idx_products_is_active` (`is_active`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
