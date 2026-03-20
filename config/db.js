const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 60000,
  ssl: {
    rejectUnauthorized: false
  }
});

const db = pool.promise();

// Keep-alive ping every 5 minutes to prevent Railway from closing the connection
setInterval(() => {
  db.query('SELECT 1')
    .then(() => console.log('🔄 DB keep-alive ping OK'))
    .catch(err => console.error('❌ DB keep-alive failed:', err.message));
}, 5 * 60 * 1000);

// Test connection on startup
db.query('SELECT 1')
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection failed:', err.message));

module.exports = db;