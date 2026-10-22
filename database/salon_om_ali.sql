CREATE DATABASE IF NOT EXISTS `salon_om_ali` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `salon_om_ali`;

CREATE TABLE IF NOT EXISTS `store_settings` (
  `id` tinyint NOT NULL,
  `store_name` varchar(120) NOT NULL,
  `logo_url` text NOT NULL,
  `homepage_image_url` text NOT NULL,
  `primary_color` char(7) NOT NULL,
  `secondary_color` char(7) NOT NULL,
  `homepage_content` longtext,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `reservations`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `offers`;
DROP TABLE IF EXISTS `product_media`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `subcategories`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `admin_password_resets`;
DROP TABLE IF EXISTS `admin_credentials`;
DROP TABLE IF EXISTS `admins`;

CREATE TABLE `admin_credentials` (
  `id` tinyint NOT NULL,
  `username` varchar(120) NOT NULL,
  `password_hash` char(64) NOT NULL,
  `password_salt` char(32) NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `admin_password_resets` (
  `id` tinyint NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('super_admin','manager','content') DEFAULT 'manager',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `subcategories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_category_id` (`category_id`),
  CONSTRAINT `fk_subcategories_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `subcategory_id` int NOT NULL,
  `code` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `rental_price` decimal(10,2) NOT NULL,
  `stock_status` enum('available','reserved','out_of_stock') DEFAULT 'available',
  `is_featured` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_subcategory_id` (`subcategory_id`),
  CONSTRAINT `fk_products_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_products_subcategory`
    FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `password_hash` char(64) DEFAULT NULL,
  `preferred_style` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_media` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `url` text NOT NULL,
  `media_type` enum('image','video') DEFAULT 'image',
  `is_primary` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `fk_product_media_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `offers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `discount_percent` int NOT NULL,
  `starts_at` date DEFAULT NULL,
  `ends_at` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `fk_offers_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `product_id` int NOT NULL,
  `order_type` enum('buy','rent') DEFAULT 'rent',
  `status` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  `quantity` int DEFAULT '1',
  `total_price` decimal(10,2) NOT NULL,
  `deposit` decimal(10,2) NOT NULL DEFAULT '0.00',
  `remaining` decimal(10,2) NOT NULL DEFAULT '0.00',
  `booking_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `fk_orders_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reservations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `appointment_date` date NOT NULL,
  `pickup_method` enum('salon','delivery') DEFAULT 'salon',
  `note` text,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  CONSTRAINT `fk_reservations_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_customer_id` (`customer_id`),
  CONSTRAINT `fk_reviews_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_rating` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admins` (`full_name`, `email`, `role`) VALUES
('أم علي', 'admin@amalaljannah.com', 'super_admin'),
('سارة', 'manager@amalaljannah.com', 'manager');

INSERT INTO `categories` (`name`, `slug`, `description`) VALUES
('تجهيز عرائسي', 'bridal-setup', 'فساتين الزفاف والتجهيزات المتكاملة'),
('تأجير فساتين', 'dress-rental', 'فساتين العرس والخطوبة والسهرات للإيجار'),
('إكسسوارات', 'accessories', 'حقائب وأكسسوارات العروس');

INSERT INTO `subcategories` (`category_id`, `name`, `slug`) VALUES
(1, 'فساتين زفاف', 'wedding-dresses'),
(1, 'تسريحة ومكياج', 'hair-makeup'),
(2, 'فساتين خطوبة', 'engagement-dresses'),
(2, 'فساتين سهرة', 'evening-dresses'),
(3, 'حقائب عروس', 'bridal-bags');

INSERT INTO `products` (`category_id`, `subcategory_id`, `code`, `name`, `price`, `rental_price`, `stock_status`, `is_featured`, `is_active`) VALUES
(1, 1, 'OM-2001', 'فستان زفاف ملكي كلاسيكي', 850.00, 250.00, 'available', 1, 1),
(2, 3, 'OM-1450', 'فستان خطوبة فخيم', 640.00, 200.00, 'reserved', 1, 1),
(3, 5, 'ACC-08', 'حقيبة عروس فاخره', 220.00, 75.00, 'available', 0, 1);

INSERT INTO `product_media` (`product_id`, `url`, `media_type`, `is_primary`) VALUES
(1, '/images/product-om-2001.jpg', 'image', 1),
(2, '/images/product-om-1450.jpg', 'image', 1),
(3, '/images/product-acc-08.jpg', 'image', 1);

INSERT INTO `offers` (`product_id`, `title`, `discount_percent`, `starts_at`, `ends_at`) VALUES
(1, 'عرض الموسم الحصري', 15, '2026-01-01', '2026-03-31'),
(2, 'خصم شهر العروس', 10, '2026-02-01', '2026-04-15');

INSERT INTO `customers` (`full_name`, `phone`, `preferred_style`) VALUES
('ليلى محمد', '966500000001', 'كلاسيكي'),
('سارة علي', '966500000002', 'فخيم');

INSERT INTO `orders` (`customer_id`, `product_id`, `order_type`, `status`, `quantity`, `total_price`) VALUES
(1, 1, 'rent', 'confirmed', 1, 250.00),
(2, 2, 'buy', 'pending', 1, 640.00);

INSERT INTO `reservations` (`order_id`, `appointment_date`, `pickup_method`, `note`) VALUES
(1, '2026-10-20', 'salon', 'تجهيزات عرس في قاعة النخبة');

INSERT INTO `reviews` (`product_id`, `customer_id`, `rating`, `comment`) VALUES
(1, 1, 5, 'الفستان كان مثاليًا ومميزًا جدًا'),
(2, 2, 4, 'التفاصيل ممتازة والخدمة مميزة');
