-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 11, 2026 at 04:37 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sumzbite_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(80) NOT NULL,
  `password_hash` varchar(64) NOT NULL,
  `full_name` varchar(120) DEFAULT 'Admin Sumzbite',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `password_hash`, `full_name`, `created_at`) VALUES
(1, 'admin', '471575bb35e9a2af16dabbb5246c7d09be778758d12ecd73cafd4099ee39f212', 'Admin Sumzbite', '2026-06-09 13:05:47');

-- --------------------------------------------------------

--
-- Table structure for table `contacts`
--

CREATE TABLE `contacts` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(120) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `customer_name` varchar(120) NOT NULL,
  `customer_phone` varchar(30) NOT NULL,
  `customer_address` text NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `total_price` int(11) NOT NULL DEFAULT 0,
  `note` text DEFAULT NULL,
  `status` enum('pending','diproses','selesai','dibatalkan') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `customer_name`, `customer_phone`, `customer_address`, `product_id`, `quantity`, `total_price`, `note`, `status`, `created_at`, `updated_at`) VALUES
(1, 'dada', '08123124556', 'JL.sakit jiwa', 1, 2, 50000, 'gugugaga', 'selesai', '2026-05-15 14:37:19', '2026-06-09 13:09:58'),
(2, 'Jonsen', '7546562452', 'qdsadasda', 2, 2, 54000, 'dasdasda', 'selesai', '2026-05-15 14:38:11', '2026-06-09 13:09:57'),
(3, 'Nanda', '08129371923', 'Jl.Jawa', 2, 2, 36000, 'saus chilli oil', 'selesai', '2026-05-30 11:41:14', '2026-06-09 13:09:56'),
(4, 'Bagas', '081802996537', 'Jalanin aja dulu', 2, 1, 18000, 'saus kecap manis pedas', 'pending', '2026-06-09 13:23:57', '2026-06-09 13:23:57'),
(5, 'Imelda', '08123456789', 'Jl. Jawa', 1, 2, 56000, 'saus chilli oil', 'pending', '2026-06-09 13:31:18', '2026-06-09 13:31:18'),
(6, 'Imelda', '08123456789', 'jl.jawa', 1, 3, 84000, 'saus chilli oil', 'pending', '2026-06-09 13:43:38', '2026-06-09 13:43:38'),
(7, 'Imelda', '08123456789', 'jl.jawa', 3, 2, 44000, 'saus chilli oil', 'pending', '2026-06-09 13:45:59', '2026-06-09 13:45:59'),
(8, 'asda', '081291312', 'jl.willey', 2, 2, 36000, 'saus chilli oil', 'pending', '2026-06-10 07:05:18', '2026-06-10 07:05:18');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `price` int(11) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `stock` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `price`, `image_url`, `stock`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Dimsum Mix (isi 4pcs)', 'Paket dimsum isi campuran dengan rasa gurih, lembut, dan cocok untuk camilan keluarga.', 28000, 'img/dimsum-mix.jpeg', 50, 1, '2026-05-15 14:33:30', '2026-05-30 12:18:57'),
(2, 'Dimsum Spicy Mayo (2pcs)', 'Dimsum lembut dengan saus spicy mayo creamy yang pedasnya pas dan bikin nagih.', 18000, 'img/dimsum-spicy-mayo.jpeg', 45, 1, '2026-05-15 14:33:30', '2026-05-30 12:19:19'),
(3, 'Dimsum Goreng (3pcs)', 'Dimsum goreng renyah di luar, juicy di dalam, cocok dimakan hangat-hangat.', 22000, 'img/dimsum-goreng.jpeg', 40, 1, '2026-05-15 14:33:30', '2026-05-30 12:19:37');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_orders_products` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `contacts`
--
ALTER TABLE `contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_products` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
