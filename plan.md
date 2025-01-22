# データベース設計と実装計画

## テーブル設計

### users テーブル
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    google_id VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### tasks テーブル
```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### subtasks テーブル
```sql
CREATE TABLE subtasks (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 認証計画

### Supabaseを使用したGoogle認証
Supabaseは既にGoogle認証を組み込みで提供しており、最も導入が容易です。

#### メリット
1. 追加のサーバーサイド実装が最小限
2. Supabaseの認証UIライブラリが利用可能
3. セッション管理が自動で行われる
4. データベースとの連携が容易
5. 開発環境でもSupabaseのAuth Emulatorが利用可能

#### 実装手順
1. Supabaseプロジェクトで認証の設定
   - Google OAuth credentialsの設定
   - Allowed redirect URLsの設定

2. クライアントサイドの実装
```javascript
// 認証関連のユーティリティ
const { auth } = supabase;

// ログイン
const signInWithGoogle = async () => {
  const { user, error } = await auth.signInWithOAuth({
    provider: 'google'
  });
};

// ログアウト
const signOut = async () => {
  const { error } = await auth.signOut();
};

// 現在のユーザー取得
const getCurrentUser = () => {
  return auth.user();
};
```

3. 認証状態の管理
   - Supabaseの`onAuthStateChange`イベントを使用
   - ユーザー情報をアプリケーションの状態管理に連携

4. 保護されたルートの実装
   - 認証が必要なルートをガード
   - 未認証ユーザーのリダイレクト

## 実装計画

### 1. データベースマイグレーション
- マイグレーションファイルの作成（開発環境用）
- Supabaseでの同一テーブル構造の作成（本番環境用）

### 2. 認証基盤の実装
- Supabase認証の設定
- 認証関連のユーティリティ作成
- 保護されたルートの実装

### 3. モデル層の実装
- `src/models/user.js`: ユーザー関連の操作
- `src/models/task.js`: タスクのCRUD操作
- `src/models/subtask.js`: サブタスクのCRUD操作

### 4. コントローラーの更新
既存のコントローラーをデータベース操作に対応するように更新：
- `src/controllers/auth-controller.js`
- `src/controllers/task-controller.js`
- `src/controllers/subtask-controller.js`

### 5. API エンドポイント
```javascript
// 認証関連
POST /api/auth/google    // Google認証開始
GET /api/auth/user      // 現在のユーザー情報取得
POST /api/auth/logout   // ログアウト

// タスク関連
POST /api/tasks           // タスク作成
GET /api/tasks           // タスク一覧取得
GET /api/tasks/:id       // タスク詳細取得
PUT /api/tasks/:id       // タスク更新
DELETE /api/tasks/:id    // タスク削除

// サブタスク関連
POST /api/tasks/:taskId/subtasks    // サブタスク作成
GET /api/tasks/:taskId/subtasks     // サブタスク一覧取得
PUT /api/subtasks/:id               // サブタスク更新
DELETE /api/subtasks/:id            // サブタスク削除
```

### 6. 実装の優先順位
1. テーブル作成とマイグレーション設定
2. Supabase認証の実装
3. タスクのCRUD操作の実装
4. サブタスクのCRUD操作の実装
5. フロントエンドとの統合
6. エラーハンドリングの実装
7. テストの作成

### 7. 環境別の設定
#### 開発環境（Docker + PostgreSQL）
- ローカルでの開発時はDockerコンテナ内のPostgreSQLを使用
- マイグレーションツールを使用してスキーマを管理
- Supabase CLIを使用してローカルで認証機能をテスト

#### 本番環境（Supabase）
- Supabaseのダッシュボードでテーブルを作成
- Supabaseの認証機能を使用
- Supabaseのクライアントライブラリを使用してデータアクセス
- 環境変数で接続情報を管理
