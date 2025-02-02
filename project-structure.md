# プロジェクトディレクトリ構造の詳細説明

## 概要
このプロジェクトは、以下のような主なディレクトリとファイルから構成されています。各ディレクトリの役割と内部のファイル構造を詳しく説明します。

---

## 主なディレクトリ構造

### 1. `coverage/`
- **役割**: テスト Coverage レポートを格納するディレクトリ
- **内部ファイル**:
  - `clover.xml`: Clover 形式の Coverage レポート
  - `coverage-final.json`: JSON 形式的な Coverage 結果
  - `lcov.info`: LCOV 形式の Coverage 結果
  - `lcov-report/`: HTML 形式的な Coverage レポート

### 2. `cypress/`
- **役割**: Cypress E2E テストを格納するディレクトリ
- **内部ファイル**:
  - `integration/`: E2E テストケース
    - `task.spec.js`: タスク関連のテスト
  - `support/`: Cypress サポートファイル
    - `index.js`: Cypress 設定

### 3. `docs/`
- **役割**: ドキュメントを格納するディレクトリ

### 4. `migrations/`
- **役割**: データベースマイグレーションを格納するディレクトリ
- **内部ファイル**:
  - `1737556635892_initial.js`: 初期マイグレーションファイル
  - `init.sql`: SQL ベースの初期化ファイル

### 5. `plan/`
- **役割**: 開発計画や設計文書を格納するディレクトリ

### 6. `public/`
- **役割**: 公開用の静的資産（HTML, CSS, JavaScript）を格納するディレクトリ
- **内部ファイル**:
  - `dashboard.html`: ダッシュボード画面
  - `gemini-todo.html`: Gemini TODO 画面
  - `login.html`: ログイン画面
  - `register.html`: 登録画面
  - `reset-password.html`: パスワードリセット画面
  - `css/`: CSS スタイルシート
    - `styles.css`
  - `js/`: JavaScript ファイル
    - `script.js`
    - `supabase.js`

### 7. `scripts/`
- **役割**: 開発やデプロイに使用するスクリプトを格納するディレクトリ
- **内部ファイル**:
  - `deploy.sh`: デプロイ用シェルスクリプト

### 8. `src/`
- **役割**: ソースコードを格納するディレクトリ
- **内部ディレクトリ**:
  - `app.js`: アプリケーションのエントリーポイント
  - `client/`: API クライアント関連
    - `api-client.js`
  - `components/`: React コンポーネント
    - `SubtaskList.js`
    - `TaskForm.js`
    - `TaskList.js`
    - `auth/`: 認証関連コンポーネント
      - `AuthContext.js`
      - `LoginForm.js`
  - `config/`: 設定ファイル
    - `database.js`
  - `controllers/`: コントローラー（API ハンドラ）
    - `auth-controller.js`
    - `subtask-controller.js`
    - `task-controller.js`
    - `user-controller.js`
  - `middleware/`: Express ミドルウェア
    - `auth.js`
    - `error-handler.js`
    - `validateTask.js`
  - `models/`: データベースモデル
    - `db.js`
    - `subtask.js`
    - `task.js`
    - `user.js`
  - `pages/`: ページ関連のコード
    - `login.js`
  - `prompts/`: プロンプト関連
    - `subtask-generation.js`
  - `routes/`: API ルート定義
    - `subtask-routes.js`
    - `task-routes.js`
    - `user-routes.js`
  - `utils/`: 利用ユーティリティ
    - `api-error.js`
    - `db.js`
    - `errors.js`
    - `prompt-manager.js`
    - `supabase.js`
  - `validators/`: バリデーション関連
    - `subtask-validator.js`
    - `task-validator.js`

### 9. `tests/`
- **役割**: 単体テストと統合テストを格納するディレクトリ
- **内部ディレクトリ**:
  - `controllers/`: コントローラーのテスト
    - `task-controller.test.js`
  - `integration/`: 統合テスト
    - `api.test.js`
  - `models/`: モデルのテスト
    - `subtask.test.js`
    - `task.test.js`
  - `routes/`: ルートのテスト
    - `task-routes.test.js`

### 10. `target/`
- **役割**: ビルド出力や生成物を格納するディレクトリ

---

## 説明
上記のディレクトリ構造は、典型的な Web アプリケーションプロジェクトのレイアウトを反映しています。各ディレクトリは特定の責務を持ち、コードの管理とメンテナンスを容易にしています。

- **`src/`**: アプリケーションの核となるソースコードが格納されています。
- **`public/`**: 静的資産（HTML, CSS, JavaScript）が格納され、直接ユーザーに提供されます。
- **`tests/`**: テストスイートが格納され、品質管理を実施します。
- **`scripts/`**: 開発とデプロイの Automation を行うスクリプトが格納されています。

この構造は、チーム開発やプロジェクトの拡張性を考慮して設計されています。


- **全体仕様**
サーバー側からAPI経由でタスクを取得し、フロントエンドでタスクの一覧表示、追加、編集、削除などの操作を行うシステムです。
タスクはすべて同一のモデル（Task）で管理され、各タスクは次の属性を持ちます：
• ID、タイトル、完了状態
• 親タスクを示す parent_id（APIからは parent_id、フロント内では parentId に変換）
• 子タスクの一覧（children 配列）
• 優先度、期限（due_date／dueDate）、およびサブタスク生成回数（generationCount）
タスクの親子関係は、APIから取得したリストに対して buildTaskHierarchy 関数により再構築されます。すでに子タスク情報がある場合は、トップレベルのタスクだけを抽出するロジックも採用しています。
タスク操作には以下が含まれます：
• タスクの追加時、認証（supabaseClient を利用）を通じAPIへリクエスト
• 編集・削除操作のための専用関数
• サブタスク追加については、AI（Gemini API）のサポートと、手動入力の双方を提供
UIはタスクの優先度・期限・完了状態を視覚的に表現し、各タスクごとに編集、削除、サブタスク追加のボタンが配置されています。
このような仕様により、タスクの階層構造が正しく管理・表示されるようになっています。