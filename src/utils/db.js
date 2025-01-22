const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// 環境変数の設定
const isDevelopment = process.env.NODE_ENV === 'development';

// 開発環境用のPostgreSQL接続設定
const devPool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'todo_db',
  password: 'postgres',
  port: 5432,
});

// Supabase接続設定
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 環境に応じたデータベースクライアントを返す
const getDbClient = () => {
  return isDevelopment ? devPool : supabase;
};

module.exports = {
  getDbClient,
  devPool,
  supabase,
}; 