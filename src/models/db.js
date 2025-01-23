import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default {
  query: (text, params) => pool.query(text, params),
  pool,
}; 