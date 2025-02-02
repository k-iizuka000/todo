// グローバル変数の定義
let tasks = [];
let taskIdCounter = 1;
let expandedTasks = new Set();
let editingTaskId = null;
let hideCompleted = false;

// 優先度の定義
const PRIORITIES = {
    URGENT: { value: 3, label: '緊急', color: '#dc3545' },
    HIGH: { value: 2, label: '要対処', color: '#ffc107' },
    NORMAL: { value: 1, label: '普通', color: '#0d6efd' },
    LOW: { value: 0, label: '後回し', color: '#6c757d' }
};

// --- 追加: 再帰的にタスクを検索するヘルパー関数 ---
function findTaskById(taskList, taskId) {
    for (let task of taskList) {
        if (task.id === taskId) return task;
        if (task.children && task.children.length > 0) {
            const found = findTaskById(task.children, taskId);
            if (found) return found;
        }
    }
    return null;
}

class Task {
    constructor(title, parentId = null) {
        this.id = taskIdCounter++;
        this.title = title;
        this.completed = false;
        this.parentId = parentId;
        this.children = [];
        this.priority = PRIORITIES.NORMAL.value;
        this.dueDate = null;
        this.generationCount = 0;
    }

    static fromAPI(apiTask) {
        console.log('Task.fromAPI called with:', apiTask);
        if (!apiTask || typeof apiTask !== 'object') {
            console.error('Invalid API task:', apiTask);
            return null;
        }
    
        const task = new Task(apiTask.title || '');
        task.id = apiTask.id || taskIdCounter++;
        task.completed = apiTask.status === 'completed';
        task.children = Array.isArray(apiTask.children) ? apiTask.children.map(child => Task.fromAPI(child)) : [];
        task.parentId = apiTask.parent_id;
        task.priority = typeof apiTask.priority === 'number' ? apiTask.priority : PRIORITIES.NORMAL.value;
        task.dueDate = apiTask.due_date || null;
    
        console.log('Task.fromAPI created task:', task);
        return task;
    }
}

// タスクの親子関係を構築する
function buildTaskHierarchy(tasks) {
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    
    // 全てのタスクのchildren配列を初期化
    tasks.forEach(task => {
        task.children = [];
    });

    // parent_idを基に親子関係を構築
    tasks.forEach(task => {
        if (task.parentId) {
            const parent = taskMap.get(task.parentId);
            if (parent) {
                parent.children.push(task);
            }
        }
    });
    
    return tasks;
}

// 初期化時の処理
async function initializeApp() {
    await fetchTasks();
}

// タスク一覧を取得する関数
async function fetchTasks() {
    try {
        console.log('Starting fetchTasks...'); // デバッグログ
        const session = await supabaseClient.auth.getSession();
        console.log('Session in fetchTasks:', session); // デバッグログ

        if (!session?.data?.session?.access_token) {
            console.error('認証セッションが見つかりません');
            window.location.href = '/login.html';
            return;
        }

        console.log('Making API request to fetch tasks...');
        const response = await fetch('/api/tasks', {
            headers: {
                'Authorization': `Bearer ${session.data.session.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Fetch tasks response status:', response.status);

        if (!response.ok) {
            if (response.status === 401) {
                alert('ログインセッションが無効です。もう一度ログインしてください。');
                window.location.href = '/login.html';
                return;
            }
            
            const errorData = await response.json();
            throw new Error(errorData.message || '不明なエラーが発生しました。しばらくしてから再試行してください。');
        }

        const apiTasks = await response.json();
        console.log('Fetched tasks data:', apiTasks);
        
        let tasksArray;
        if (Array.isArray(apiTasks)) {
            tasksArray = apiTasks;
        } else if (apiTasks.data && Array.isArray(apiTasks.data)) {
            tasksArray = apiTasks.data;
        } else {
            tasksArray = [];
        }
        
        console.log('Parsed tasks array:', tasksArray);
        
        const newTasks = tasksArray.map(task => {
            console.log('Converting task:', task);
            return Task.fromAPI(task);
        });
        console.log('Converted tasks:', newTasks);

        const validIds = newTasks.map(t => t.id).filter(id => !isNaN(id) && id !== null);
        taskIdCounter = validIds.length > 0 ? Math.max(...validIds) + 1 : 1;
        console.log('Updated taskIdCounter:', taskIdCounter);
        
        const alreadyGrouped = newTasks.some(t => t.children && t.children.length > 0);
        if (alreadyGrouped) {
            tasks = newTasks.filter(t => !t.parentId);
            console.log('Using already grouped tasks:', tasks);
        } else {
            tasks = buildTaskHierarchy(newTasks);
            console.log('Built task hierarchy:', tasks);
        }

        // 既存の展開状態を保持しつつ、サブタスクを持つ親タスクを展開
        const currentExpandedTasks = new Set(expandedTasks);
        tasks.forEach(task => {
            if (task.children && task.children.length > 0) {
                currentExpandedTasks.add(task.id);
            }
        });
        expandedTasks = currentExpandedTasks;

        displayTasks(tasks);
    } catch (error) {
        console.error('タスク取得エラーの詳細:', error);
        const taskList = document.getElementById('taskList');
        if (taskList) {
            taskList.innerHTML = `
                <div class="alert alert-danger">
                    <p>タスクの取得に失敗しました。</p>
                    <p>エラー詳細: ${error.message}</p>
                    <div class="mt-3">
                        <button onclick="location.reload()" class="btn btn-outline-danger">
                            ページを再読み込み
                        </button>
                        <button onclick="window.location.href='/login.html'" class="btn btn-danger ml-2">
                            ログインページへ戻る
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

// AI APIを使用してサブタスクを生成
async function generateSubtasks(taskText, parentTaskId) {
    const parentTask = findTaskById(tasks, parentTaskId);
    
    // サブタスクの数をチェック
    if (parentTask.children.length >= 4) {
        const suggestionsDiv = document.getElementById('suggestions');
        suggestionsDiv.innerHTML = `
            <div class="error-message">
                サブタスクは最大4つまでしか追加できません。
            </div>
        `;
        return;
    }

    if (parentTask.generationCount >= 3) {
        const suggestionsDiv = document.getElementById('suggestions');
        suggestionsDiv.innerHTML = `
            <div class="error-message">
                このタスクに対するサブタスク生成は3回までです。手動でサブタスクを追加してください。
            </div>
        `;
        displayManualSubtaskInput(parentTaskId);
        return;
    }

    parentTask.generationCount++;
    
    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <span>AIがサブタスクを考えています...</span>
        </div>
    `;
    suggestionsDiv.style.display = 'block';

    try {
        const session = await supabaseClient.auth.getSession();
        if (!session?.data?.session?.access_token) {
            throw new Error('認証トークンが見つかりません');
        }

        const response = await fetch('/api/subtasks/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.data.session.access_token}`
            },
            body: JSON.stringify({ 
                title: taskText,
                description: '' 
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'サブタスクの生成に失敗しました');
        }

        if (data.subtasks && data.subtasks.length > 0) {
            displaySuggestions(data.subtasks, parentTaskId);
        } else {
            throw new Error('サブタスクの生成に失敗しました');
        }
    } catch (error) {
        console.error('Error generating suggestions:', error);
        const suggestionsDiv = document.getElementById('suggestions');
        suggestionsDiv.innerHTML = `
            <div class="error-message">
                ${error.message || 'サブタスクの生成に失敗しました。もう一度お試しください。'}
            </div>
        `;
        displayManualSubtaskInput(parentTaskId);
    }
}

// 手動サブタスク入力フォームを表示する関数
function displayManualSubtaskInput(parentTaskId) {
    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = `
        <div class="manual-input">
            <h4>サブタスクを手動で追加</h4>
            <div class="input-group">
                <input type="text" id="manualSubtaskInput" class="form-control" placeholder="サブタスクを入力...">
                <button onclick="addManualSubtask(${parentTaskId})" class="btn btn-primary">追加</button>
            </div>
        </div>
    `;
    suggestionsDiv.style.display = 'block';
}

// 手動でサブタスクを追加する関数
async function addManualSubtask(parentTaskId) {
    const input = document.getElementById('manualSubtaskInput');
    const title = input.value.trim();
    
    if (!title) return;

    try {
        const session = await supabaseClient.auth.getSession();
        if (!session?.data?.session?.access_token) {
            throw new Error('認証トークンが見つかりません');
        }

        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.data.session.access_token}`
            },
            body: JSON.stringify({
                title,
                parent_id: parentTaskId
            })
        });

        if (!response.ok) {
            throw new Error('サブタスクの追加に失敗しました');
        }

        input.value = '';
        const suggestionsDiv = document.getElementById('suggestions');
        suggestionsDiv.style.display = 'none';
        await fetchTasks();
    } catch (error) {
        console.error('Error adding manual subtask:', error);
        alert(error.message);
    }
}

// サブタスクの提案を表示する関数
function displaySuggestions(subtasks, parentTaskId) {
    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = `
        <div class="suggestions-list">
            <h4>提案されたサブタスク</h4>
            <ul>
                ${subtasks.map((subtask) => `
                    <li>
                        <span>${typeof subtask === 'string' ? subtask.replace(/^[-・*]\s*/, '') : subtask.title}</span>
                        <button onclick="addSuggestedSubtask(${parentTaskId}, '${typeof subtask === 'string' ? subtask.replace(/^[-・*]\s*/, '').replace(/'/g, "\\'") : subtask.title}')" class="btn btn-sm btn-primary">
                            追加
                        </button>
                    </li>
                `).join('')}
            </ul>
            <button onclick="displayManualSubtaskInput(${parentTaskId})" class="btn btn-secondary">
                手動で追加
            </button>
        </div>
    `;
}

// サブタスク追加ボタンのハンドラー
async function handleAddSubtask(parentTaskId) {
    const parentTask = findTaskById(tasks, parentTaskId);
    if (!parentTask) return;

    // サジェスト領域を表示する前に画面上部にスクロール
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <span>AIがサブタスクを考えています...</span>
        </div>
    `;
    suggestionsDiv.style.display = 'block';

    try {
        await generateSubtasks(parentTask.title, parentTaskId);
    } catch (error) {
        console.error('Error handling subtask addition:', error);
        suggestionsDiv.style.display = 'none';
    }
}

// サブタスク追加後の処理を修正
async function addSuggestedSubtask(parentTaskId, title) {
    try {
        console.log('Adding suggested subtask:', { parentTaskId, title });
        
        const session = await supabaseClient.auth.getSession();
        if (!session?.data?.session?.access_token) {
            throw new Error('認証トークンが見つかりません');
        }

        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.data.session.access_token}`
            },
            body: JSON.stringify({ 
                title: title,
                parent_id: parentTaskId,
                status: 'pending',
                priority: PRIORITIES.NORMAL.value
            })
        });
        
        console.log('API Response status:', response.status);
        const data = await response.json();
        console.log('API Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.message || 'サブタスクの追加に失敗しました');
        }

        const suggestionsDiv = document.getElementById('suggestions');
        suggestionsDiv.style.display = 'none';
        
        const parentTask = findTaskById(tasks, parentTaskId);
        if (parentTask) {
            parentTask.generationCount = (parentTask.generationCount || 0) + 1;
        }

        // 新しいタスクのIDを保存
        const newTaskId = data.data.id;
        console.log('New task ID:', newTaskId);

        // タスク一覧を更新
        await fetchTasks();

        // DOMの更新が確実に完了するのを待ってからスクロール
        requestAnimationFrame(() => {
            // 追加されたタスクの要素を探す（複数回試行）
            const findAndScrollToTask = (attempts = 0) => {
                console.log(`Attempting to find task element (attempt ${attempts + 1})`);
                const addedTask = document.querySelector(`div[data-task-id="${newTaskId}"]`);
                
                if (addedTask) {
                    console.log('Found task element, scrolling...');
                    // スクロールとハイライト
                    addedTask.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    addedTask.style.transition = 'background-color 0.3s ease';
                    addedTask.style.backgroundColor = '#e8f0fe';
                    setTimeout(() => {
                        addedTask.style.backgroundColor = '';
                    }, 1500);
                } else if (attempts < 5) {
                    // 最大5回まで100ms間隔で再試行
                    console.log('Task element not found, retrying...');
                    setTimeout(() => findAndScrollToTask(attempts + 1), 100);
                } else {
                    console.log('Failed to find task element after multiple attempts');
                }
            };

            findAndScrollToTask();
        });
    } catch (error) {
        console.error('Error adding suggested subtask:', error);
        alert(error.message || 'サブタスクの追加に失敗しました');
    }
}

// ヘルパー関数: タスクのネストレベルを取得 (トップレベルは1)
function getTaskLevel(task) {
    if (!task.parentId) {
        return 1;
    } else {
        const parentTask = findTaskById(tasks, task.parentId);
        return parentTask ? 1 + getTaskLevel(parentTask) : 1;
    }
}

// renderTaskElement 関数を修正
function renderTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task';
    taskElement.dataset.taskId = task.id;
    
    const priorityInfo = Object.values(PRIORITIES).find(p => p.value === task.priority);
    taskElement.innerHTML = `
        <div class="task-content">
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskStatus(${task.id}, this.checked)">
            <span class="task-title truncated ${task.completed ? 'completed' : ''}" 
                  style="border-left: 3px solid ${priorityInfo?.color || '#000'}; padding-left: 8px;"
                  onclick="toggleTitleExpand(this)">
                ${task.title}
            </span>
            <div class="task-details">
                <span class="task-due">${task.dueDate ? '期限: ' + formatDate(task.dueDate) : '期限: なし'}</span>
                <span class="task-priority">優先度: ${priorityInfo ? priorityInfo.label : '不明'}</span>
            </div>
            <div class="task-actions">
                <button class="edit-button" onclick="startEditing(${task.id})">編集</button>
                ${getTaskLevel(task) < 4 ? `<button class="add-subtask-button" onclick="handleAddSubtask(${task.id})">サブタスク追加</button>` : ''}
                <button class="delete-button" onclick="deleteTask(${task.id})">削除</button>
            </div>
        </div>
    `;
    
    return taskElement;
}

// タイトルの展開/折りたたみを切り替える関数を追加
function toggleTitleExpand(element) {
    // 編集モード中は展開/折りたたみを無効化
    if (element.closest('.task').querySelector('.edit-mode')) {
        return;
    }
    
    element.classList.toggle('expanded');
    
    // アニメーションのために一時的にtransitionを追加
    element.style.transition = 'max-height 0.3s ease';
    
    // アニメーション終了後にtransitionを削除
    setTimeout(() => {
        element.style.transition = '';
    }, 300);
}

// Update the displayTasks function
function displayTasks(tasks) {
    console.log('Starting displayTasks with:', tasks);
    const taskList = document.getElementById('taskList');
    if (!taskList) {
        console.error('taskList element not found');
        return;
    }
    taskList.innerHTML = '';
    const ul = document.createElement('ul');
    ul.style.listStyleType = 'none';
    tasks.forEach(function(task) {
        ul.appendChild(renderNestedTask(task));
    });
    taskList.appendChild(ul);
    console.log('Finished displaying tasks');
}

// タスク編集を開始する関数
function startEditing(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    const titleElement = taskElement.querySelector('.task-title');
    const currentTitle = titleElement.textContent.trim();
    const task = findTaskById(tasks, taskId);
    
    editingTaskId = taskId;
    titleElement.innerHTML = `
        <div class="edit-mode">
            <input type="text" class="edit-input" value="${currentTitle}">
            <input type="date" class="edit-date" value="${task.dueDate || ''}">
            <button onclick="showPriorityChangePopup(${taskId}, ${task.priority})">
                優先度: ${Object.values(PRIORITIES).find(p => p.value === task.priority).label}
            </button>
            <div class="edit-buttons">
                <button onclick="saveEdit(${task.id})" class="btn btn-sm btn-success">保存</button>
                <button onclick="cancelEdit()" class="btn btn-sm btn-secondary">キャンセル</button>
            </div>
        </div>
    `;
}

// タスクの編集を保存する関数 (トークン取得方法を統一)
async function saveEdit(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    const titleInput = taskElement.querySelector('.edit-input');
    const dateInput = taskElement.querySelector('.edit-date');
    const task = findTaskById(tasks, taskId);
    
    const newTitle = titleInput.value.trim();
    const newDueDate = dateInput.value;

    if (newTitle && task) {
        try {
            const session = await supabaseClient.auth.getSession();
            if (!session?.data?.session?.access_token) {
                throw new Error("認証トークンが見つかりません");
            }
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.data.session.access_token}`
                },
                body: JSON.stringify({
                    title: newTitle,
                    due_date: newDueDate || null,
                    priority: task.priority
                })
            });

            if (!response.ok) throw new Error('タスクの更新に失敗しました');

            task.title = newTitle;
            task.dueDate = newDueDate || null;
            editingTaskId = null;
            await fetchTasks();
        } catch (error) {
            console.error('タスク更新エラー:', error);
            alert('タスクの更新に失敗しました: ' + error.message);
        }
    }
}

// -------------------------
// 優先度変更用の関数群を追加
// -------------------------

function showPriorityChangePopup(taskId, currentPriority) {
  // ユーザーに新しい優先度を入力させる (0: 後回し, 1: 普通, 2: 要対策, 3: 緊急)
  const newPriorityStr = prompt("新しい優先度を入力してください (0: 後回し, 1: 普通, 2: 要対策, 3: 緊急):", currentPriority);
  if (newPriorityStr === null) {
    return;
  }
  const newPriority = parseInt(newPriorityStr, 10);
  if (isNaN(newPriority) || newPriority < 0 || newPriority > 3) {
    alert("有効な優先度（0～3）を入力してください。");
    return;
  }
  updateTaskPriority(taskId, newPriority);
}

async function updateTaskPriority(taskId, newPriority) {
  const task = findTaskById(tasks, taskId);
  if (!task) {
    console.error("タスクが見つかりません:", taskId);
    return;
  }
  try {
    const session = await supabaseClient.auth.getSession();
    if (!session?.data?.session?.access_token) {
      throw new Error("認証トークンが見つかりません");
    }
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.data.session.access_token}`
      },
      body: JSON.stringify({
        title: task.title,
        due_date: task.dueDate || null,
        priority: newPriority
      })
    });
    if (!response.ok) {
      throw new Error("優先度の更新に失敗しました");
    }
    task.priority = newPriority;
    alert("優先度が更新されました");
    await fetchTasks();
  } catch (error) {
    console.error("優先度更新エラー:", error);
    alert("優先度の更新に失敗しました: " + error.message);
  }
}

// -------------------------
// その他の必要な関数
// -------------------------
function getDueDateStatus(dueDate) {
    if (!dueDate) return 'normal';
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'urgent';
    if (diffDays <= 3) return 'warning';
    return 'normal';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
}

// タスクを追加する関数
async function addTask(event) {
    event.preventDefault();
    const taskInput = document.getElementById('taskTitle');
    const dueDateInput = document.getElementById('dueDateInput');
    const taskText = taskInput.value.trim();
    const dueDate = dueDateInput.value;

    if (!taskText) return;

    // AIによるサブタスク生成中の表示
    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <span>AIがサブタスクを考えています...</span>
        </div>
    `;
    suggestionsDiv.style.display = 'block';

    try {
        const session = await supabaseClient.auth.getSession();
        if (!session?.data?.session?.access_token) {
            console.error('No access token found');
            return;
        }

        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.data.session.access_token}`
            },
            body: JSON.stringify({
                title: taskText,
                due_date: dueDate || null
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'タスクの追加に失敗しました');
        }

        // タスク追加成功後、入力をクリアしてタスク一覧を更新
        taskInput.value = '';
        dueDateInput.value = '';
        await fetchTasks();

        // サブタスク生成を開始
        if (data.data && data.data.id) {
            await generateSubtasks(taskText, data.data.id);
        }
    } catch (error) {
        console.error('Error adding task:', error);
        alert(error.message || 'タスクの追加に失敗しました');
        suggestionsDiv.style.display = 'none';
    }
}

// タスクを削除する関数
async function deleteTask(taskId) {
    if (!confirm('このタスクを削除してもよろしいですか？')) {
        return;
    }

    try {
        console.log('Deleting task:', taskId);

        const session = await supabaseClient.auth.getSession();
        if (!session?.data?.session?.access_token) {
            throw new Error('認証トークンが見つかりません');
        }

        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.data.session.access_token}`
            }
        });

        console.log('Delete response status:', response.status);

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || 'タスクの削除に失敗しました');
        }

        await fetchTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
        alert(error.message || 'タスクの削除に失敗しました');
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', initializeApp);

// --- 追加開始: ネストされたタスク表示用関数の更新 ---
// renderNestedTask を修正して、親タスク内にトグルボタンを埋め込み、子タスクの表示/非表示を切替える

function renderNestedTask(task) {
    const li = document.createElement('li');
    li.style.listStyleType = 'none';
    
    // タスク要素を作成
    const taskElement = document.createElement('div');
    taskElement.className = 'task';
    taskElement.dataset.taskId = task.id;
    
    const priorityInfo = Object.values(PRIORITIES).find(p => p.value === task.priority);
    
    // 子タスクがある場合、トグルボタンを追加
    const hasChildren = task.children && task.children.length > 0;
    const toggleButton = hasChildren ? `<button class="toggle-children ${expandedTasks.has(task.id) ? 'expanded' : ''}" onclick="toggleChildren(${task.id}, event)"></button>` : '';
    
    taskElement.innerHTML = `
        <div class="task-content">
            ${toggleButton}
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskStatus(${task.id}, this.checked)">
            <span class="task-title truncated ${task.completed ? 'completed' : ''}" 
                  style="border-left: 3px solid ${priorityInfo?.color || '#000'}; padding-left: 8px;"
                  onclick="toggleTitleExpand(this)">
                ${task.title}
            </span>
            <div class="task-details">
                <span class="task-due">${task.dueDate ? '期限: ' + formatDate(task.dueDate) : '期限: なし'}</span>
                <span class="task-priority">優先度: ${priorityInfo ? priorityInfo.label : '不明'}</span>
            </div>
            <div class="task-actions">
                <button class="edit-button" onclick="startEditing(${task.id})">編集</button>
                ${getTaskLevel(task) < 4 ? `<button class="add-subtask-button" onclick="handleAddSubtask(${task.id})">サブタスク追加</button>` : ''}
                <button class="delete-button" onclick="deleteTask(${task.id})">削除</button>
            </div>
        </div>
    `;
    li.appendChild(taskElement);

    // 子タスクがある場合は再帰的にレンダリング
    if (hasChildren) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = `task-children ${expandedTasks.has(task.id) ? 'expanded' : ''}`;
        const childrenUl = document.createElement('ul');
        childrenUl.style.listStyleType = 'none';
        childrenUl.style.marginLeft = '20px';
        task.children.forEach(childTask => {
            childrenUl.appendChild(renderNestedTask(childTask));
        });
        childrenContainer.appendChild(childrenUl);
        li.appendChild(childrenContainer);
    }

    return li;
}

// 子タスクの表示/非表示を切り替える関数を追加
function toggleChildren(taskId, event) {
    event.stopPropagation();
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    const toggleButton = taskElement.querySelector('.toggle-children');
    const childrenContainer = taskElement.parentElement.querySelector('.task-children');
    
    if (expandedTasks.has(taskId)) {
        expandedTasks.delete(taskId);
        toggleButton.classList.remove('expanded');
        childrenContainer.classList.remove('expanded');
    } else {
        expandedTasks.add(taskId);
        toggleButton.classList.add('expanded');
        childrenContainer.classList.add('expanded');
    }
}
// --- 追加終了 ---

function toggleTaskStatus(taskId, checked) {
    const task = findTaskById(tasks, taskId);
    if (!task) {
        console.error("タスクが見つかりません：", taskId);
        return;
    }
    (async () => {
        try {
            const session = await supabaseClient.auth.getSession();
            if (!session?.data?.session?.access_token) {
                throw new Error("認証トークンが見つかりません");
            }
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.data.session.access_token}`
                },
                body: JSON.stringify({
                    title: task.title,
                    status: checked ? "completed" : "pending"
                })
            });
            if (!response.ok) {
                throw new Error("タスク状態の更新に失敗しました");
            }
            await fetchTasks();
        } catch (error) {
            console.error("タスク状態の更新エラー:", error);
            alert("タスク状態の更新に失敗しました: " + error.message);
        }
    })();
}

// 既存のtoggleTaskStatus関数の下に、完了タスクの表示/非表示を切り替える関数を追加します
function filterCompletedTasks(taskList) {
    return taskList.filter(task => !task.completed).map(task => {
        const newTask = Object.assign({}, task);
        if (task.children && task.children.length > 0) {
            newTask.children = filterCompletedTasks(task.children);
        }
        return newTask;
    });
}

function toggleCompletedTasks() {
    hideCompleted = !hideCompleted;
    console.log('hideCompleted:', hideCompleted);
    if (hideCompleted) {
        displayTasks(filterCompletedTasks(tasks));
    } else {
        displayTasks(tasks);
    }
}
    
    
    