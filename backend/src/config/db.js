const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // ✅ Evita que mysql2 convierta DATE/DATETIME a objetos Date con timezone
  dateStrings: true,

  ssl: process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : undefined,
});

module.exports = pool;
