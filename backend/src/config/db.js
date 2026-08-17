const { Pool } = require('pg');
require('dotenv').config();

// Pool reads connection info from environment variables so the same code
// works locally, in Docker, and against AWS RDS without changes.
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'task_inventory',
  // RDS requires SSL in most default setups; toggle via env var.
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

module.exports = pool;
