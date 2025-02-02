# 実装ガイド

## 必要なコマンド

### 1. 開発環境のセットアップ
```bash
# Docker環境の起動
docker-compose up -d

# 依存パッケージのインストール
npm install

# データベースマイグレーションの実行
npm run migrate:up

# 開発サーバーの起動
npm start

# テストの実行
npm test
```

### 2. データベースの操作
```bash
# マイグレーションの作成
npm run migrate:create <migration_name>

# マイグレーションを1つ戻す
npm run migrate:down

# マイグレーションの状態確認
npm run migrate status
```

## 未完了のタスク

### 1. ルーターの実装
- [x] タスクルーターの作成 (`src/routes/task-routes.js`)
- [x] サブタスクルーターの作成 (`src/routes/subtask-routes.js`)
- [x] メインアプリケーションへのルーター統合

### 2. 認証基盤の実装
- [x] Supabaseプロジェクトの作成
- [x] Google OAuth認証の設定
- [x] 認証ミドルウェアの実装
- [x] ユーザー管理機能の実装

### 3. フロントエンド統合
- [x] APIクライアントの実装
- [x] 認証状態の管理
- [x] タスク管理UI
- [x] サブタスク管理UI

### 4. エラーハンドリング
- [x] グローバルエラーハンドラーの実装
- [x] バリデーションの実装
- [x] エラーレスポンスの標準化

### 5. テスト
- [x] コントローラーのテスト実装
- [x] ルーターのテスト実装
- [x] 統合テストの実装
- [x] E2Eテストの実装

### 6. デプロイメント準備
- [x] 本番環境用の設定ファイル作成
- [x] 環境変数の整理
- [x] デプロイメントスクリプトの作成
- [x] CIパイプラインの設定

## 環境変数の設定

`.env`ファイルに以下の環境変数を設定する必要があります：

```env
# 開発環境設定
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/todo_db

# Supabase設定（本番環境用）
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth設定（本番環境用）
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 注意事項

1. データベース操作
   - 開発環境ではDockerコンテナ内のPostgreSQLを使用
   - 本番環境ではSupabaseを使用
   - マイグレーションは両環境で同じスキーマを維持

2. 認証
   - 開発環境でもSupabase CLIを使用して認証機能をテスト可能
   - 本番環境ではSupabaseの認証機能を使用

3. テスト
   - ユニットテストはJestを使用
   - テストカバレッジは90%以上を維持 