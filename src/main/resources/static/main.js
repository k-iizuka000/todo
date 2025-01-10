document.addEventListener('DOMContentLoaded', function() {
  const todoForm = document.getElementById('todoForm');
  const todoList = document.getElementById('todo-list');
  let showCompleted = true;

  // 初期状態でボタンのテキストを設定
  const toggleButton = document.getElementById('toggle-visibility-btn');
  if (toggleButton) {
    toggleButton.querySelector('.toggle-text').textContent = '完了タスクを非表示';
  }

  // エラー表示関数
  function showError(message, containerId = 'alert-container') {
    const container = document.getElementById(containerId);
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    container.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
  }

  // タスク取得と表示
  async function fetchTodos() {
    try {
      const response = await fetch('/api/todos');
      if (!response.ok) throw new Error('タスクの取得に失敗しました');
      const todos = await response.json();
      renderTodos(todos);
    } catch (error) {
      showError(error.message);
    }
  }

  // タスクの表示
  function renderTodos(todos) {
    todoList.innerHTML = '';
    todos.forEach(todo => {
      const todoItem = renderTodoItem(todo);
      // 初期表示時に完了タスクの表示/非表示を設定
      if (!showCompleted && todo.completed) {
        todoItem.classList.add('d-none');
      }
      todoList.appendChild(todoItem);
    });
  }

  // 個別のタスクアイテムの描画
  function renderTodoItem(todo) {
    const todoItem = document.createElement('div');
    todoItem.className = 'list-group-item d-flex align-items-center todo-item';
    if (todo.completed) {
      todoItem.classList.add('todo-completed');
    }
    todoItem.dataset.todoId = todo.id;

    // チェックボックスとコンテンツ
    const checkbox = createCheckbox(todo);
    const content = createTodoContent(todo);
    const buttons = createActionButtons(todo);

    todoItem.appendChild(checkbox);
    todoItem.appendChild(content);
    todoItem.appendChild(buttons);
    
    return todoItem;
  }

  // チェックボックスの作成
  function createCheckbox(todo) {
    const container = document.createElement('div');
    container.className = 'form-check';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'form-check-input';
    checkbox.checked = todo.completed;
    checkbox.onchange = () => toggleTodoCompletion(todo.id);

    container.appendChild(checkbox);
    return container;
  }

  // タスクコンテンツの作成
  function createTodoContent(todo) {
    const content = document.createElement('div');
    content.className = 'flex-grow-1 ms-3';
    
    const title = document.createElement('div');
    title.className = todo.completed ? 'completed' : '';
    title.textContent = todo.title;
    
    content.appendChild(title);
    
    if (todo.description) {
      const description = document.createElement('small');
      description.className = 'text-muted d-block';
      description.textContent = todo.description;
      content.appendChild(description);
    }

    const createdAt = document.createElement('div');
    createdAt.className = 'created-at';
    createdAt.textContent = `Created: ${new Date(todo.createdAt).toLocaleString('ja-JP')}`;
    content.appendChild(createdAt);

    return content;
  }

  // アクションボタンの作成
  function createActionButtons(todo) {
    const buttons = document.createElement('div');
    buttons.className = 'ms-auto btn-group';
    
    const completeBtn = document.createElement('button');
    completeBtn.className = 'btn btn-complete';
    completeBtn.textContent = todo.completed ? '未完了' : '完了';
    completeBtn.onclick = () => toggleTodoCompletion(todo.id);
    buttons.appendChild(completeBtn);
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-edit';
    editBtn.textContent = '編集';
    editBtn.onclick = () => showEditModal(todo);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-delete';
    deleteBtn.textContent = '削除';
    deleteBtn.onclick = () => deleteTodo(todo.id);

    buttons.appendChild(editBtn);
    buttons.appendChild(deleteBtn);
    return buttons;
  }

  // 完了状態の切り替え
  async function toggleTodoCompletion(id) {
    try {
      const checkbox = document.querySelector(`input[type="checkbox"][onchange="toggleTodoCompletion(${id})"]`);
      const response = await fetch(`/api/todos/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      if (!response.ok) throw new Error('完了状態の更新に失敗しました');
      fetchTodos();
    } catch (error) {
      showError(error.message);
    }
  }

  // 完了タスクの表示/非表示切り替え
  window.toggleCompletedVisibility = function() {
    showCompleted = !showCompleted;
    console.log('Toggle visibility:', showCompleted);

    // ボタンのテキストを更新
    const button = document.getElementById('toggle-visibility-btn');
    if (button) {
      const toggleText = button.querySelector('.toggle-text');
      if (toggleText) {
        toggleText.textContent = showCompleted ? '完了タスクを非表示' : '完了タスクを表示';
      }
    }
    
    // 完了タスクの表示/非表示を切り替え
    const completedItems = document.querySelectorAll('.todo-item.todo-completed');
    console.log('Found completed items:', completedItems.length);
    
    completedItems.forEach(item => {
      console.log('Toggling item:', item.dataset.todoId);
      if (showCompleted) {
        item.classList.remove('d-none');
      } else {
        item.classList.add('d-none');
      }
    });
  };

  // 編集モーダルの表示
  async function showEditModal(todo) {
    const editModal = new bootstrap.Modal(document.getElementById('editModal'));
    document.getElementById('edit-id').value = todo.id;
    document.getElementById('edit-title').value = todo.title;
    document.getElementById('edit-description').value = todo.description || '';
    editModal.show();
  }

  // タスクの削除
  async function deleteTodo(id) {
    if (!confirm('このタスクを削除してもよろしいですか？')) return;
    
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('タスクの削除に失敗しました');
      fetchTodos();
    } catch (error) {
      showError(error.message);
    }
  }

  // 新規タスク追加フォームの処理
  if (todoForm) {
    todoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('title').value;
      const description = document.getElementById('description').value;
      
      try {
        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description })
        });
        
        if (!response.ok) throw new Error('タスクの追加に失敗しました');
        todoForm.reset();
        fetchTodos();
      } catch (error) {
        showError(error.message);
      }
    });
  }

  // 編集フォームの処理
  document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const title = document.getElementById('edit-title').value;
    const description = document.getElementById('edit-description').value;
    
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });
      
      if (!response.ok) throw new Error('タスクの更新に失敗しました');
      bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
      fetchTodos();
    } catch (error) {
      showError(error.message, 'edit-alert');
    }
  });

  // 初期データの取得
  fetchTodos();
});
