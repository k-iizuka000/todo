# タスク登録の問題調査結果

## 原因特定

1. **決定的な問題: データベース接続の実装ミス**
   ```javascript
   // src/utils/db.js の現状
   const connectDB = async () => {
     try {
       const client = await pool.connect();
       console.log('PostgreSQL Connected');
       client.release();
       return pool;
     } catch (error) {
       console.error(`Error: ${error.message}`);
       process.exit(1);
     }
   };
   export default connectDB;  // 関数をエクスポート
   
   // src/models/task.js での問題のある使用
   import db from './db.js';  // db は関数になってしまう
   const result = await db.query(query, values);  // エラー: db.query is not a function
   ```

2. **問題の確認方法**
   ```javascript
   // コンソールログを追加して問題を特定
   console.log('db object:', db);  // 関数が表示される
   console.log('typeof db:', typeof db);  // 'function' が表示される
   ```

## 修正手順

1. **データベース接続の修正**
   ```javascript
   // src/utils/db.js
   import pkg from 'pg';
   const { Pool } = pkg;
   import dotenv from 'dotenv';

   dotenv.config();

   // プールを作成
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL
   });

   export default pool;  // プールを直接エクスポート
   ```

2. **モデルの修正**
   ```javascript
   // src/models/task.js
   import pool from '../utils/db.js';

   class Task {
     static async create({ title, description, userId }) {
       const client = await pool.connect();
       try {
         const query = `
           INSERT INTO tasks (title, description, user_id)
           VALUES ($1, $2, $3)
           RETURNING *
         `;
         const values = [title, description, userId];
         const result = await client.query(query, values);
         return result.rows[0];
       } finally {
         client.release();
       }
     }

     // タスク一覧取得メソッド
     static async findAll(userId) {
       const client = await pool.connect();
       try {
         const query = `
           SELECT t.*, 
                  COUNT(s.id) as subtask_count,
                  COUNT(CASE WHEN s.is_completed THEN 1 END) as completed_subtask_count
           FROM tasks t
           LEFT JOIN subtasks s ON t.id = s.task_id
           WHERE t.user_id = $1
           GROUP BY t.id
           ORDER BY t.created_at DESC
         `;
         const result = await client.query(query, [userId]);
         return result.rows;
       } finally {
         client.release();
       }
     }

     // 単一タスク取得メソッド
     static async findById(id, userId) {
       const client = await pool.connect();
       try {
         const query = `
           SELECT t.*, 
                  json_agg(s.*) as subtasks
           FROM tasks t
           LEFT JOIN subtasks s ON t.id = s.task_id
           WHERE t.id = $1 AND t.user_id = $2
           GROUP BY t.id
         `;
         const result = await client.query(query, [id, userId]);
         return result.rows[0];
       } finally {
         client.release();
       }
     }
   }
   ```

3. **アプリケーション初期化の修正**
   ```javascript
   // src/app.js
   import express from 'express';
   import userRoutes from './routes/user-routes.js';
   import taskRoutes from './routes/task-routes.js';
   import { errorHandler } from './middleware/error-handler.js';
   import pool from './utils/db.js';  // poolを直接インポート

   const app = express();

   // ミドルウェア
   app.use(express.json());
   app.use(express.static('public'));

   // ルート
   app.use('/', userRoutes);
   app.use('/api/tasks', taskRoutes);

   // エラーハンドリング
   app.use(errorHandler);

   // サーバー起動前の接続テスト
   const start = async () => {
     try {
       // 接続テスト
       const client = await pool.connect();
       console.log('Database connection successful');
       client.release();

       const PORT = process.env.PORT || 3000;
       app.listen(PORT, () => {
         console.log(`Server is running on port ${PORT}`);
       });
     } catch (error) {
       console.error('Failed to start server:', error);
       process.exit(1);
     }
   };

   start();
   ```

## データベース初期化手順

1. **データベースの作成**
   ```bash
   # PostgreSQLにログイン
   psql postgres

   # データベース作成
   CREATE DATABASE todo_db;
   ```

2. **テーブルの作成**
   ```sql
   -- テーブル作成用のSQLファイル: migrations/init.sql
   CREATE TABLE IF NOT EXISTS users (
     id SERIAL PRIMARY KEY,
     email VARCHAR(255) NOT NULL UNIQUE,
     password VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE IF NOT EXISTS tasks (
     id SERIAL PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     description TEXT,
     user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
     status VARCHAR(50) DEFAULT 'pending',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE IF NOT EXISTS subtasks (
     id SERIAL PRIMARY KEY,
     task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
     content TEXT NOT NULL,
     is_completed BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. **初期データの投入**
   ```sql
   -- テスト用ユーザーの作成
   INSERT INTO users (email, password) 
   VALUES ('test@example.com', '$2b$10$YourHashedPassword') 
   RETURNING id;
   ```

4. **マイグレーションの実行**
   ```bash
   # マイグレーションの実行
   psql $DATABASE_URL < migrations/init.sql
   ```

## 動作確認手順

1. **データベース接続確認**
   ```bash
   # PostgreSQLが起動しているか確認
   ps aux | grep postgres
   
   # データベースに接続できるか確認
   psql $DATABASE_URL -c "SELECT 1"
   ```

2. **テーブル存在確認**
   ```bash
   # tasksテーブルの存在確認
   psql $DATABASE_URL -c "\d tasks"
   ```

3. **タスク登録テスト**
   ```javascript
   // tests/task-create.js
   import pool from '../src/utils/db.js';
   
   async function testTaskCreation() {
     const client = await pool.connect();
     try {
       const result = await client.query(`
         INSERT INTO tasks (title, description, user_id)
         VALUES ($1, $2, $3)
         RETURNING *
       `, ['テストタスク', 'テスト説明', 1]);
       
       console.log('Created task:', result.rows[0]);
     } finally {
       client.release();
     }
   }
   
   testTaskCreation().catch(console.error);
   ```

4. **タスク参照テスト**
   ```javascript
   // tests/task-read.js
   import pool from '../src/utils/db.js';
   
   async function testTaskReading() {
     const client = await pool.connect();
     try {
       // タスク一覧の取得
       const allTasks = await client.query(`
         SELECT * FROM tasks WHERE user_id = $1
       `, [1]);
       console.log('All tasks:', allTasks.rows);

       // 特定のタスクの取得
       if (allTasks.rows.length > 0) {
         const taskId = allTasks.rows[0].id;
         const singleTask = await client.query(`
           SELECT * FROM tasks WHERE id = $1
         `, [taskId]);
         console.log('Single task:', singleTask.rows[0]);
       }
     } finally {
       client.release();
     }
   }
   
   testTaskReading().catch(console.error);
   ```

## 確認ポイント

1. **データベース接続**
   - [ ] PostgreSQLが起動している
   - [ ] DATABASE_URLが正しく設定されている
   - [ ] 接続テストが成功する

2. **テーブル構造**
   - [ ] tasksテーブルが存在する
   - [ ] 必要なカラムが全て存在する
   - [ ] user_idの外部キーが正しく設定されている

3. **実行時の確認**
   - [ ] コンソールにエラーが出ていないか
   - [ ] レスポンスが返ってきているか
   - [ ] データベースにレコードが作成されているか

## 問題が解決しない場合のデバッグ手順

1. **接続確認**
   ```javascript
   // src/utils/db.js に追加
   pool.on('error', (err) => {
     console.error('Unexpected error on idle client', err);
   });
   
   pool.on('connect', () => {
     console.log('New client connected to database');
   });
   ```

2. **クエリログの確認**
   ```javascript
   // src/models/task.js のcreateメソッド内
   console.log('Executing query with values:', values);
   const result = await client.query(query, values);
   console.log('Query result:', result.rows[0]);
   ```

これで、ローカルでのタスク登録の問題を100%特定し、修正できるはずです。

## 実行手順（順番に実施すること）

1. **環境変数の設定**
   ```bash
   # .envファイルを作成
   cat << EOF > .env
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/todo_db
   NODE_ENV=development
   PORT=3000
   EOF
   ```

2. **データベースの初期化**
   ```bash
   # PostgreSQLの起動確認
   pg_ctl status

   # 起動していない場合は起動
   pg_ctl start

   # データベース作成
   psql postgres -c "CREATE DATABASE todo_db;"
   ```

3. **テーブルの作成とデータ投入**
   ```bash
   # マイグレーションの実行
   psql $DATABASE_URL < migrations/init.sql

   # パスワードハッシュの生成
   node -e "const bcrypt = require('bcrypt'); bcrypt.hash('password123', 10).then(hash => console.log(hash));"
   # 出力されたハッシュ値をコピーする

   # 初期データの投入とユーザーIDの保存
   echo "INSERT INTO users (email, password) VALUES ('test@example.com', '生成したハッシュ値') RETURNING id;" > create_user.sql
   USER_ID=$(psql $DATABASE_URL -t -A -f create_user.sql)
   
   # 環境変数に追加
   echo "export TEST_USER_ID=$USER_ID" >> .env
   
   # テスト用のJWTトークンを生成
   node -e "const jwt = require('jsonwebtoken'); const token = jwt.sign({ id: process.env.TEST_USER_ID }, process.env.JWT_SECRET || 'your_jwt_secret'); console.log(token);" > jwt_token.txt
   echo "export TEST_AUTH_TOKEN=$(cat jwt_token.txt)" >> .env

   # 確認
   echo "作成されたユーザーID: $USER_ID"
   echo "生成されたJWTトークン: $(cat jwt_token.txt)"
   ```

4. **アプリケーションの起動**
   ```bash
   # 依存パッケージのインストール
   npm install

   # アプリケーションの起動
   npm start
   ```

5. **動作確認**
   ```javascript
   // tests/task-create.js
   import pool from '../src/utils/db.js';
   import dotenv from 'dotenv';

   dotenv.config();

   async function testTaskCreation() {
     const client = await pool.connect();
     try {
       // 環境変数からユーザーIDを取得
       const userId = process.env.TEST_USER_ID;
       if (!userId) {
         throw new Error('TEST_USER_IDが設定されていません');
       }

       const result = await client.query(`
         INSERT INTO tasks (title, description, user_id)
         VALUES ($1, $2, $3)
         RETURNING *
       `, ['テストタスク', 'テスト説明', userId]);
       
       console.log('Created task:', result.rows[0]);
     } finally {
       client.release();
     }
   }

   testTaskCreation().catch(console.error);
   ```

   ```javascript
   // tests/api-test.js
   import fetch from 'node-fetch';
   import dotenv from 'dotenv';

   dotenv.config();

   async function testTaskAPI() {
     try {
       // 環境変数から認証トークンを取得
       const authToken = process.env.TEST_AUTH_TOKEN;
       if (!authToken) {
         throw new Error('TEST_AUTH_TOKENが設定されていません');
       }

       // タスク作成APIのテスト
       const response = await fetch('http://localhost:3000/api/tasks', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${authToken}`
         },
         body: JSON.stringify({
           title: 'APIテストタスク',
           description: 'APIからのテスト'
         })
       });

       const data = await response.json();
       console.log('API response:', data);
     } catch (error) {
       console.error('API test failed:', error);
     }
   }

   testTaskAPI();
   ```

## エラーメッセージの日本語化

```javascript
// src/utils/api-error.js
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
  }
}

// エラーメッセージの定義
export const ERROR_MESSAGES = {
  DB_CONNECTION: 'データベースへの接続に失敗しました',
  TASK_NOT_FOUND: 'タスクが見つかりません',
  TASK_CREATE_FAILED: 'タスクの作成に失敗しました',
  INVALID_USER: 'ユーザーが見つかりません',
  VALIDATION_ERROR: '入力データが不正です'
};

// src/models/task.js のエラーハンドリング修正
static async create({ title, description, userId }) {
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO tasks (title, description, user_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [title, description, userId];
    const result = await client.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('タスク作成エラー:', error);
    if (error.code === '23503') {
      throw new ApiError(400, ERROR_MESSAGES.INVALID_USER);
    }
    throw new ApiError(500, ERROR_MESSAGES.TASK_CREATE_FAILED);
  } finally {
    client.release();
  }
}
```

## 前提条件の確認

1. **必要なパッケージ**
   ```json
   // package.json
   {
     "dependencies": {
       "express": "^4.18.2",
       "pg": "^8.11.3",
       "dotenv": "^16.3.1",
       "bcrypt": "^5.1.1",
       "jsonwebtoken": "^9.0.2",
       "node-fetch": "^3.3.2"
     },
     "type": "module"
   }
   ```

2. **PostgreSQL権限の確認**
   ```bash
   # PostgreSQLユーザーの権限確認
   psql postgres -c "\du"

   # 必要な権限がない場合は付与
   psql postgres -c "ALTER USER postgres CREATEDB;"
   psql postgres -c "ALTER USER postgres WITH SUPERUSER;"
   ```

3. **ファイル権限の確認**
   ```bash
   # マイグレーションディレクトリの作成と権限設定
   mkdir -p migrations
   chmod 755 migrations

   # .envファイルの権限設定
   touch .env
   chmod 600 .env  # セキュリティのため、.envは所有者のみ読み書き可能に
   ``` 