# TODOリストアプリ (MVP)

## 概要
- **目的**  
  - Docker環境下でSpring Boot + MySQLを用いて、シンプルなTODOリストを作成するMVPアプリケーション  
  - フロントエンドはHTML/Bootstrap/JavaScriptを使用し、バックエンドのAPIを呼び出してTODOを管理  
- **特徴**  
  - Docker ComposeによりアプリとDBをマルチコンテナで運用  
  - 基本的なCRUD機能を実装 (追加・編集・削除・完了/未完了切り替え)  
  - MySQLデータをホスト側に永続化し、コンテナ再起動後もデータを保持  

## 主要機能
1. **TODO作成**: タイトルや詳細を入力して新規登録  
2. **TODO一覧表示**: 登録済みTODOを取得・表示  
3. **TODO編集**: タイトル・詳細の変更  
4. **TODO削除**: 不要になったTODOを削除  
5. **完了状態の切り替え**: TODOを完了/未完了に更新  

## 追加機能

- **編集機能の実装**: TODOを編集できるようにします。編集ボタンをクリックすると、入力フォームに既存のTODO情報が表示され、更新が可能になります。

- **削除時の確認ダイアログ**: 削除ボタンを押した際に確認ダイアログを表示し、ユーザーが削除を確認できるようにします。

- **完了タスクの非表示と表示切替ボタン**: チェックがついたタスクを非表示にし、"完了タスクを表示"ボタンを追加して、完了したタスクを再表示できるようにします。

- **子タスクの追加**: 親タスクに対して子タスクを追加できるようにします。例えば、「晩御飯を作る」というタスクを作成した際に、モーダルで「【晩御飯を作る】を達成するためのタスクはありますか？」と表示し、複数の子タスクを追加できるようにします。

- **子タスクの表示**: 一覧表示では、子タスクは親タスクから少しずらして表示し、ネストしていることがわかるようにします。これにより、タスクの階層構造を視覚的に把握しやすくします。

## システム構成
```
[ブラウザ] --(HTTP)--> [Spring Bootコンテナ : 8080] --(内部ネットワーク)--> [MySQLコンテナ : 3306]
```

## 開発環境
- **OS**: Windows / Mac / Linux  
- **Docker / Docker Compose**  
  - Docker Engine 20.x 以降推奨  
  - Docker Compose v2.0 以降推奨  
- **Java**: 17  
- **MySQL**: 8.x (Dockerイメージ使用)  

## ディレクトリ構成 (一例)

```  
.
├── docker-compose.yml
├── README.md
├── app
│   ├── Dockerfile
│   ├── pom.xml
│   └── src
│       ├── main
│       │   ├── java
│       │   │   └── com.example.todo
│       │   │       ├── TodoApplication.java
│       │   │       ├── controller
│       │   │       ├── entity
│       │   │       ├── repository
│       │   │       └── service
│       │   └── resources
│       │       ├── application.yml
│       │       ├── static
│       │       │   └── (HTML/CSS/JSファイル)
│       │       └── templates (Thymeleaf等使う場合)
└── (その他必要ファイル)
```

## セットアップ手順

1. **リポジトリをクローン**  
   ```
   git clone https://github.com/your-repo/todo-mvp.git
   cd todo-mvp
   ```

2. **Dockerイメージのビルド** (初回のみ)  
   ```
   docker-compose build
   ```

3. **コンテナ起動**  
   ```
   docker-compose up -d
   ```
   - ブラウザで `http://localhost:8080` にアクセスしてTODO画面を確認

4. **コンテナ停止**  
   ```
   docker-compose down
   ```
   - データはホストボリュームに保存されるため、再起動で復元される  

## API仕様 (例)

| メソッド | エンドポイント     | 内容                  | リクエストパラメータ例                                  | レスポンス例                                     |
|:--------:|:------------------:|:---------------------:|:--------------------------------------------------------:|:------------------------------------------------:|
| **GET**    | `/api/todos`       | TODO一覧を取得        | なし                                                     | `[{ "id":1, "title":"Task1","completed":false }, ...]` |
| **POST**   | `/api/todos`       | TODOを新規登録        | `{"title":"買い物","description":"牛乳を買う","completed":false}` | 登録後のTODOオブジェクト（JSON）                           |
| **PUT**    | `/api/todos/{id}`  | TODOを更新           | `{"title":"買い物(更新)","description":"卵も買う"}`      | 更新後のTODOオブジェクト（JSON）                           |
| **PATCH**  | `/api/todos/{id}`  | 完了状態を切り替え    | `{"completed":true}`                                     | 更新後のTODOオブジェクト（JSON）                           |
| **DELETE** | `/api/todos/{id}`  | TODOを削除           | なし                                                     | HTTPステータス(204)                                   |

## DBテーブル構成 (例)

| フィールド名 | 型        | 備考                   |
|:-----------:|:---------:|:----------------------:|
| id (PK)     | BIGINT    | AUTO_INCREMENT         |
| title       | VARCHAR   | TODOタイトル           |
| description | TEXT      | TODO詳細               |
| completed   | BOOLEAN   | デフォルト`false`       |
| created_at  | DATETIME  | (必要に応じて管理)      |
| updated_at  | DATETIME  | (必要に応じて管理)      |

## フロントエンド (HTML/Bootstrap/JavaScript) 例
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <title>TODOリスト</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootswatch/5.1.3/cosmo/bootstrap.min.css">
</head>
<body class="p-3">
  <div class="container">
    <h1>TODOリスト (MVP)</h1>
    <div id="todo-list"></div>
    
    <form id="todo-form" class="row mt-3">
      <div class="col-md-4">
        <input type="text" id="title" class="form-control" placeholder="TODOタイトル" required>
      </div>
      <div class="col-md-5">
        <input type="date" id="due-date" class="form-control" placeholder="期限">
      </div>
      <div class="col-md-3">
        <button type="submit" class="btn btn-primary w-100" style="background-color: #ff69b4; border-color: #ff69b4;">追加</button>
      </div>
    </form>
  </div>

  <script>
    const todoListContainer = document.getElementById('todo-list');
    const todoForm = document.getElementById('todo-form');

    // TODO一覧を取得して表示
    async function fetchTodos() {
      const res = await fetch('/api/todos');
      const todos = await res.json();
      renderTodos(todos);
    }

    // TODO一覧表示用
    function renderTodos(todos) {
      let html = '<ul class="list-group">';
      todos.forEach(todo => {
        html += `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                     onchange="toggleComplete(${todo.id}, ${!todo.completed})">
              <strong style="text-decoration: ${todo.completed ? 'line-through' : 'none'};">${todo.title}</strong>
              <p class="mb-0">期限: ${todo.dueDate || '未設定'}</p>
            </div>
            <div>
              <button class="btn btn-sm btn-success" style="background-color: #32cd32; border-color: #32cd32;" onclick="editTodo(${todo.id})">編集</button>
              <button class="btn btn-sm btn-danger" style="background-color: #ff4500; border-color: #ff4500;" onclick="deleteTodo(${todo.id})">削除</button>
            </div>
          </li>
        `;
      });
      html += '</ul>';
      todoListContainer.innerHTML = html;
    }

    // TODO追加
    todoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('title').value;
      const description = document.getElementById('description').value;
      await fetch('/api/todos', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({title, description, completed:false})
      });
      todoForm.reset();
      fetchTodos();
    });

    // TODO削除
    async function deleteTodo(id) {
      await fetch('/api/todos/' + id, {method:'DELETE'});
      fetchTodos();
    }

    // 完了切り替え
    async function toggleComplete(id, completed) {
      await fetch('/api/todos/' + id, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({completed})
      });
      fetchTodos();
    }

    // TODO編集 (本来は入力フォームやモーダルで編集)
    function editTodo(id) {
      alert('編集機能はMVP段階のため未実装の例です。ID:'+id);
      // 実際にはPUTメソッドで更新する処理を追加
    }

    // 初期表示
    fetchTodos();
  </script>
</body>
</html>
```

## 今後の拡張
- **ユーザー認証**: ログイン機能を追加し、ユーザーごとにTODOを管理  
- **UI強化**: Vue.js/Reactなどを導入し、SPA化で操作性を向上  
- **テスト自動化**: Spring Bootの単体テストやAPIテストを整備  
- **CI/CD**: GitHub Actionsなどで自動ビルド、デプロイの導入  

## ライセンス
- 本MVPテンプレートはMITライセンスなどで自由にご利用いただけます。

## お問い合わせ
- 質問や不具合報告はリポジトリのIssue、または開発担当者へご連絡ください。
