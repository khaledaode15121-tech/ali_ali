import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

export const db = mysql.createPool({
  host: DB_HOST || "localhost",
  port: Number(DB_PORT || 3306),
  user: DB_USER || "root",
  password: DB_PASSWORD || "",
  database: DB_NAME || "salon_om_ali",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testConnection() {
  try {
    const [rows] = await db.query("SELECT 1 AS ok");
    return rows;
  } catch (error) {
    console.error("Database connection failed:", error);
    return null;
  }
}
