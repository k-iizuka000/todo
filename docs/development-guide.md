# 開発者ガイド

## 環境構築

### 必要な環境
- Node.js v18以上
- Docker
- Docker Compose
- npm または yarn

### 初期セットアップ

1. リポジトリのクローン
```bash
git clone <repository-url>
cd todo
```

2. 環境変数の設定
```bash
cp .env.example .env
```

3. 依存パッケージのインストール
```bash
npm install
```

4. 開発環境の起動
```bash
docker-compose up -d  # PostgreSQLの起動
npm run dev          # 開発サーバーの起動
```

## データベース

### 開発環境
- PostgreSQL（Docker）
  - ポート: 5432
  - データベース名: todo_db
  - ユーザー名: postgres
  - パスワード: postgres

### マイグレーション

```bash
# マイグレーションの作成
npm run migrate:create <migration-name>

# マイグレーションの実行
npm run migrate:up

# マイグレーションの巻き戻し
npm run migrate:down

# マイグレーションの状態確認
npm run migrate:status
```

### 本番環境
- Supabase
  - マイグレーションは自動的に適用
  - スキーマの変更は開発環境で検証後に適用

## 環境変数

### 必須の環境変数
```env
# アプリケーション設定
NODE_ENV=development
PORT=3000

# データベース設定
DATABASE_URL=postgres://postgres:postgres@localhost:5432/todo_db

# Supabase設定
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth設定
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Vercelデプロイ設定
VERCEL_TOKEN=your_vercel_token
```

### 環境別の設定

#### 開発環境
- `NODE_ENV=development`
- ローカルのPostgreSQLを使用
- Supabase CLIでローカルテスト可能

#### テスト環境
- `NODE_ENV=test`
- テスト用のデータベースを使用
- モックされた認証を使用

#### 本番環境
- `NODE_ENV=production`
- Supabaseを使用
- 本番用の認証情報を使用

## テスト

### テストの種類

1. ユニットテスト
```bash
npm run test:unit
```
- `src/**/*.test.js`に配置
- コントローラー、モデル、ユーティリティのテスト
- Jestを使用

2. 統合テスト
```bash
npm run test:integration
```
- `tests/integration/**/*.test.js`に配置
- APIエンドポイントのテスト
- Supertestを使用

3. E2Eテスト
```bash
# Cypressテストの実行（ヘッドレス）
npm run test:e2e

# Cypressテストの実行（GUI）
npm run test:e2e:open
```
- `cypress/integration/**/*.spec.js`に配置
- ユーザーフローのテスト
- Cypressを使用

### テストの実行

```bash
# 全てのテストを実行
npm test

# 特定のテストファイルを実行
npm test <file-path>

# テストカバレッジの確認
npm run test:coverage
```

### テスト環境の準備

1. テストデータベースの準備
```bash
npm run db:test:setup
```

2. テスト用の環境変数設定
```bash
cp .env.test.example .env.test
```

## CI/CD

### GitHub Actions

- プルリクエスト時にテストを実行
- mainブランチへのマージ時に自動デプロイ
- 必要なシークレット:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `VERCEL_TOKEN`

### デプロイ

1. 手動デプロイ
```bash
npm run deploy
```

2. ステージング環境へのデプロイ
```bash
npm run deploy:staging
```

3. 本番環境へのデプロイ
```bash
npm run deploy:production
``` 