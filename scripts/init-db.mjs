import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

const connection = await mysql.createConnection({
  host: DB_HOST || "localhost",
  port: Number(DB_PORT || 3306),
  user: DB_USER || "root",
  password: DB_PASSWORD || "",
  multipleStatements: true,
});

const databaseName = DB_NAME || "salon_om_ali";

async function resetDatabase() {
  await connection.query(`DROP DATABASE IF EXISTS \`${databaseName}\`;`);
  await connection.query(`CREATE DATABASE \`${databaseName}\`;`);
  await connection.query(`USE \`${databaseName}\`;`);
}

async function init() {
  await resetDatabase();

  await connection.query(`
    CREATE TABLE admin_credentials (
      id TINYINT NOT NULL PRIMARY KEY,
      username VARCHAR(120) NOT NULL,
      password_hash CHAR(64) NOT NULL,
      password_salt CHAR(32) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await connection.query(`
    CREATE TABLE admin_password_resets (
      id TINYINT NOT NULL PRIMARY KEY,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await connection.query(`
    CREATE TABLE admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      role ENUM('super_admin','manager','content') DEFAULT 'manager',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await connection.query(`
    CREATE TABLE categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await connection.query(`
    CREATE TABLE subcategories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_category_id (category_id),
      CONSTRAINT fk_subcategories_category
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await connection.query(`
    CREATE TABLE products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      subcategory_id INT NOT NULL,
      code VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      rental_price DECIMAL(10,2) NOT NULL,
      stock_status ENUM('available','reserved','out_of_stock') DEFAULT 'available',
      is_featured TINYINT(1) DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_category_id (category_id),
      INDEX idx_subcategory_id (subcategory_id),
      CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      CONSTRAINT fk_products_subcategory
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await connection.query(`
    CREATE TABLE customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      password VARCHAR(255),
      password_hash CHAR(64),
      preferred_style VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await connection.query(`
    CREATE TABLE product_media (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      url TEXT NOT NULL,
      media_type ENUM('image','video') DEFAULT 'image',
      is_primary TINYINT(1) DEFAULT 0,
      INDEX idx_product_id (product_id),
      CONSTRAINT fk_product_media_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await connection.query(`
    CREATE TABLE offers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      discount_percent INT NOT NULL,
      starts_at DATE,
      ends_at DATE,
      INDEX idx_product_id (product_id),
      CONSTRAINT fk_offers_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await connection.query(`
    CREATE TABLE orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      product_id INT NOT NULL,
      order_type ENUM('buy','rent') DEFAULT 'rent',
      status ENUM('pending','confirmed','completed','cancelled') DEFAULT 'pending',
      quantity INT DEFAULT 1,
      total_price DECIMAL(10,2) NOT NULL,
      deposit DECIMAL(10,2) NOT NULL DEFAULT 0,
      remaining DECIMAL(10,2) NOT NULL DEFAULT 0,
      booking_date DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_customer_id (customer_id),
      INDEX idx_product_id (product_id),
      CONSTRAINT fk_orders_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      CONSTRAINT fk_orders_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await connection.query(`
    CREATE TABLE reservations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      appointment_date DATE NOT NULL,
      pickup_method ENUM('salon','delivery') DEFAULT 'salon',
      note TEXT,
      INDEX idx_order_id (order_id),
      CONSTRAINT fk_reservations_order
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await connection.query(`
    CREATE TABLE reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      customer_id INT NOT NULL,
      rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_product_id (product_id),
      INDEX idx_customer_id (customer_id),
      CONSTRAINT fk_reviews_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      CONSTRAINT fk_reviews_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await connection.query(`
    CREATE TABLE store_settings (
      id TINYINT PRIMARY KEY,
      store_name VARCHAR(120) NOT NULL,
      logo_url TEXT NOT NULL,
      homepage_image_url TEXT NOT NULL,
      primary_color CHAR(7) NOT NULL,
      secondary_color CHAR(7) NOT NULL,
      homepage_content LONGTEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log(`Database ${databaseName} initialized successfully.`);
  await connection.end();
}

init().catch((err) => {
  console.error("Database initialization failed:", err);
  process.exit(1);
});
