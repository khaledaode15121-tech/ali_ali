import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { randomBytes, scryptSync } from "node:crypto";

dotenv.config();
const username = String(process.env.ADMIN_USERNAME || "").trim();
const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || "");
if (username.length < 3 || username.length > 120) throw new Error("Set ADMIN_USERNAME to 3-120 characters.");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Set ADMIN_EMAIL to a valid email address.");
if (password.length < 8 || Buffer.byteLength(password, "utf8") > 128) throw new Error("Set ADMIN_PASSWORD to 8-128 bytes.");
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "salon_om_ali",
});
try {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS admin_credentials (
      id TINYINT NOT NULL PRIMARY KEY,
      username VARCHAR(120) NOT NULL,
      email VARCHAR(254) NOT NULL DEFAULT '',
      password_hash CHAR(64) NOT NULL,
      password_salt CHAR(32) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  const [columns] = await connection.query("SHOW COLUMNS FROM admin_credentials LIKE 'email'");
  if (!columns.length) await connection.query("ALTER TABLE admin_credentials ADD COLUMN email VARCHAR(254) NOT NULL DEFAULT '' AFTER username");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  await connection.query(
    "INSERT INTO admin_credentials (id, username, email, password_hash, password_salt) VALUES (1, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE username=VALUES(username), email=VALUES(email), password_hash=VALUES(password_hash), password_salt=VALUES(password_salt)",
    [username, email, hash, salt],
  );
  console.log("Admin credentials updated. The password itself was not stored or displayed.");
} finally {
  await connection.end();
}
