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

class Task {
    constructor(text, parentId = null) {
        this.id = taskIdCounter++;
        this.title = text;
        this.completed = false;
        this.parentId = parentId;
        this.children = [];
        this.priority = PRIORITIES.NORMAL.value;
        this.dueDate = null;
        this.generationCount = 0;
    }
    static fromAPI(apiTask) {
        if (!apiTask || typeof apiTask !== 'object') {
            console.error('Invalid API task:', apiTask);
            return null;
        }
    
        const task = new Task(apiTask.title || '', apiTask.parentId || null); // title を使用
        task.id = apiTask.id || taskIdCounter++;
        task.completed = Boolean(apiTask.completed);
        task.children = Array.isArray(apiTask.children) ? apiTask.children : [];
        task.parentId = apiTask.parent_id || null;
        
        // 優先度の取得
        task.priority = typeof apiTask.priority === 'number' ? 
            Math.min(Math.max(apiTask.priority, 0), 3) : 
            PRIORITIES.NORMAL.value;
    
        // dueDate を正しく処理する
        if (apiTask.dueDate) {
            const date = new Date(apiTask.dueDate);
            task.dueDate = isNaN(date.getTime()) ? null : apiTask.dueDate;
        } else {
            task.dueDate = null;
        }
    
        task.generationCount = typeof apiTask.generationCount === 'number' ? 
            Math.max(apiTask.generationCount, 0) : 0;
    
        return task;
    }
    
}

// 初期化時にAPIキーを設定
async function initializeApp() {
    // APIからタスクを取得
    await fetchTasks();
}

// タスクをサーバーから取得
async function fetchTasks() {
    try {
        const response = await fetch('/api/tasks', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
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
        console.log('API Response:', apiTasks);

        // APIレスポンスの構造を確認し、対応する配列を作成
        let tasksArray;
        if (Array.isArray(apiTasks)) {
            tasksArray = apiTasks;
        } else if (apiTasks.tasks && Array.isArray(apiTasks.tasks)) {
            tasksArray = apiTasks.tasks;
        } else {
            tasksArray = [];
        }
        
        // 配列をTaskオブジェクトに変換
        const newTasks = tasksArray.map(task => Task.fromAPI(task));
        
        // 有効なIDの最大値を取得
        const validIds = newTasks.map(t => t.id).filter(id => !isNaN(id) && id !== null);
        taskIdCounter = validIds.length > 0 ? Math.max(...validIds) + 1 : 1;
        
        // tasks配列を更新
        tasks = newTasks;
        renderTasks();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        alert('タスクの取得に失敗しました。ページを更新してください。');
    }
}

// Gemini APIを使用してサブタスクを生成
async function generateSubtasks(taskText, parentTaskId) {
    const parentTask = tasks.find(t => t.id === parentTaskId);
    
    // サブタスクの数をチェック
    if (parentTask.children.length >= 4) {
        const suggestionsDiv = document.getElementById('suggestions');
        suggestionsDiv.innerHTML = `
            <div class="error-message" style="color: #dc3545; padding: 10px; background-color: #f8d7da; border-radius: 4px; margin-bottom: 15px;">
                サブタスクは最大4つまでしか追加できません。
            </div>
        `;
        return;
    }

    if (parentTask.generationCount >= 3) {
        const suggestionsDiv = document.getElementById('suggestions');
        suggestionsDiv.innerHTML = `
            <div class="error-message" style="color: #dc3545; padding: 10px; background-color: #f8d7da; border-radius: 4px; margin-bottom: 15px;">
                このタスクに対するサブタスク生成は3回までです。手動でサブタスクを追加してください。
            </div>
        `;
        displayManualSubtaskInput(parentTaskId);
        return;
    }

    parentTask.generationCount++; // 生成回数をインクリメント
    
    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <span>AIがサブタスクを考えています...</span>
        </div>
    `;
    suggestionsDiv.style.display = 'block';

    try {
        const response = await fetch('/api/subtasks/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // トークンを追加
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
            <div class="error-message" style="color: #dc3545; padding: 10px; background-color: #f8d7da; border-radius: 4px; margin-bottom: 15px;">
                ${error.message || 'サブタスクの生成に失敗しました。もう一度お試しください。'}
            </div>
        `;
        displayManualSubtaskInput(parentTaskId);
    }
}

// サブタスクの提案を表示
function displaySuggestions(suggestions, parentTaskId) {
    const suggestionsDiv = document.getElementById('suggestions');
    const parentTask = tasks.find(t => t.id === parentTaskId);
    const priorityInfo = Object.values(PRIORITIES).find(p => p.value === parentTask.priority);
    
    if (suggestions && suggestions.length > 0) {
        suggestionsDiv.innerHTML = `
            <div class="current-task-info" style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef;">
                <h3 style="margin: 0 0 10px 0;">現在選択中のタスク:</h3>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="border-left: 3px solid ${priorityInfo.color}; padding-left: 8px; flex: 1;">
                        ${parentTask.title}
                    </span>
                    <span style="color: ${priorityInfo.color}; font-size: 0.9em; padding: 2px 8px; border: 1px solid ${priorityInfo.color}; border-radius: 4px;">
                        ${priorityInfo.label}
                    </span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <h3 style="margin: 0;">AIが提案する関連タスク:</h3>
                    ${parentTask.generationCount < 3 ? `
                        <button onclick="generateSubtasks('${parentTask.title}', ${parentTaskId})" style="padding: 4px 8px; border-radius: 4px;">
                            <span style="display: inline-block;">🔄</span>
                        </button>
                    ` : ''}
                </div>
                <span style="color: #6c757d; font-size: 0.9em;">
                    残り生成回数: ${3 - parentTask.generationCount}回
                </span>
            </div>
            ${suggestions.map(suggestion => `
                <div class="suggestion">
                    <button onclick="addTask('${suggestion}', ${parentTaskId})">追加</button>
                    <span>${suggestion}</span>
                </div>
            `).join('')}
            <div class="manual-input">
                <h3>または手動でサブタスクを追加:</h3>
                <div class="input-group">
                    <input type="text" id="manual-subtask-input" placeholder="サブタスクを入力..."
                        onkeypress="if(event.key === 'Enter') addManualSubtask(${parentTaskId})">
                    <button onclick="addManualSubtask(${parentTaskId})">追加</button>
                </div>
            </div>
        `;
        suggestionsDiv.style.display = 'block';
    } else {
        displayManualSubtaskInput(parentTaskId);
    }
}

// 手動サブタスク入力フォームを表示
function displayManualSubtaskInput(parentTaskId) {
    const suggestionsDiv = document.getElementById('suggestions');
    const parentTask = tasks.find(t => t.id === parentTaskId);
    const priorityInfo = Object.values(PRIORITIES).find(p => p.value === parentTask.priority);

    suggestionsDiv.innerHTML = `
        <div class="current-task-info" style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef;">
            <h3 style="margin: 0 0 10px 0;">現在選択中のタスク:</h3>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="border-left: 3px solid ${priorityInfo.color}; padding-left: 8px; flex: 1;">
                    ${parentTask.title}
                </span>
                <span style="color: ${priorityInfo.color}; font-size: 0.9em; padding: 2px 8px; border: 1px solid ${priorityInfo.color}; border-radius: 4px;">
                    ${priorityInfo.label}
                </span>
            </div>
        </div>
        <div class="manual-input">
            <h3>サブタスクを追加:</h3>
            <div class="input-group">
                <input type="text" id="manual-subtask-input" placeholder="サブタスクを入力..."
                    onkeypress="if(event.key === 'Enter') addManualSubtask(${parentTaskId})">
                <button onclick="addManualSubtask(${parentTaskId})">追加</button>
            </div>
        </div>
    `;
    suggestionsDiv.style.display = 'block';
}

// 手動でサブタスクを追加
function addManualSubtask(parentId) {
    const input = document.getElementById('manual-subtask-input');
    const text = input.value.trim();
    if (text) {
        addTask(text, parentId);
        input.value = '';
        const suggestionsDiv = document.getElementById('suggestions');
        suggestionsDiv.style.display = 'none';
    }
}

// タスクを追加
function addTask(text, parentId = null) {
    const input = document.getElementById('taskInput');
    const dueDateInput = document.getElementById('dueDateInput');
    const taskText = text || input.value.trim();
    
    if (taskText) {
        // 親タスクが存在する場合、階層レベルをチェック
        if (parentId) {
            const parentTask = tasks.find(t => t.id === parentId);
            if (parentTask) {
                const level = getTaskLevel(parentTask);
                if (level >= 3) { // 親が3レベル以上なら、子は4レベル以上になるためブロック
                    alert('これ以上深い階層のサブタスクは追加できません。');
                    return;
                }
            }
        }

        const newTask = new Task(taskText, parentId);
        newTask.dueDate = dueDateInput.value || null;

        // DBに新規タスクを保存
        fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                title: taskText,  // text → title 変更
                parentId: parentId || null,
                dueDate: newTask.dueDate
            })
        }).then(response => {
            if (response.ok) {
                tasks.push(newTask);
                // 親タスクが存在する場合、children配列を更新
                if (parentId) {
                    const parentTask = tasks.find(t => t.id === parentId);
                    if (parentTask) {
                        parentTask.children.push(newTask.id);
                        // 親タスクのアコーディオンを開く
                        expandedTasks.add(parentId);
                    }
                }
                // suggestions divを非表示にする
                const suggestionsDiv = document.getElementById('suggestions');
                if (suggestionsDiv) {
                    suggestionsDiv.style.display = 'none';
                }

                renderTasks();


                // スクロール処理を分岐
                setTimeout(() => {
                    if (!parentId) {
                        // 親タスク追加時は画面トップにスクロール
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                        // サブタスク追加時は追加したタスクまでスクロール
                        const taskElement = document.getElementById(`task-${newTask.id}`);
                        if (taskElement) {
                            taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                }, 100);

                if (!text && !parentId) {
                    generateSubtasks(taskText, newTask.id);
                }
            }
        }).catch(error => {
            console.error('Error adding task:', error);
            alert('タスクの追加に失敗しました。しばらくしてからもう一度お試しください。');
        });

        input.value = '';
        dueDateInput.value = '';

        // 新しく追加されたタスクまでスクロール
        setTimeout(() => {
            const taskElement = document.getElementById(`task-${newTask.id}`);
            if (taskElement) {
                taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
}


// タスクの完了状態を切り替え
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
    }
}

// タスクの展開/折りたたみを切り替え
function toggleExpand(id) {
    if (expandedTasks.has(id)) {
        expandedTasks.delete(id);
    } else {
        expandedTasks.add(id);
    }
    renderTasks();
}

// タスクを削除
function deleteTask(id) {
    if (confirm('このタスクを削除してもよろしいですか？\nサブタスクも全て削除されます。')) {
        // DBからタスクを削除するAPIリクエスト
        fetch(`/api/tasks/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        }).then(response => {
            if (response.ok) {
                // 削除対象のタスクとそのすべての子孫タスクのIDを収集
                function getAllChildIds(taskId) {
                    const task = tasks.find(t => t.id === taskId);
                    if (!task) return [];
                    const childIds = task.children.flatMap(childId => getAllChildIds(childId));
                    return [taskId, ...childIds];
                }

                // 削除対象のタスクの親タスクを取得
                const taskToDelete = tasks.find(t => t.id === id);
                if (taskToDelete && taskToDelete.parentId) {
                    const parentTask = tasks.find(t => t.id === taskToDelete.parentId);
                    if (parentTask) {
                        // 親タスクのchildren配列から、削除対象のタスクIDを削除
                        parentTask.children = parentTask.children.filter(childId => childId !== id);
                    }
                }

                // すべての削除対象タスクIDを取得
                const idsToDelete = getAllChildIds(id);
                
                // 削除対象のタスクとその子孫タスクを tasks 配列から削除
                tasks = tasks.filter(t => !idsToDelete.includes(t.id));
                
                // 残っているタスクの children 配列から、削除されたタスクのIDを除去
                tasks.forEach(task => {
                    task.children = task.children.filter(childId => !idsToDelete.includes(childId));
                });
                
                renderTasks();
            } else {
                alert('タスクの削除に失敗しました。しばらくしてからもう一度お試しください。');
            }
        }).catch(error => {
            console.error('Error deleting task:', error);
            alert('タスクの削除に失敗しました。しばらくしてからもう一度お試しください。');
        });
    }
}

// タスク編集モードを開始
function startEditing(taskId) {
    editingTaskId = taskId;
    renderTasks();
    setTimeout(() => {
        const input = document.getElementById(`edit-input-${taskId}`);
        if (input) {
            input.focus();
            input.select();
        }
    }, 0);
}

// タスクの編集を保存
function saveEdit(taskId) {
    const task = tasks.find(t => t.id === taskId);
    const editInput = document.getElementById(`edit-input-${taskId}`);
    const dateInput = document.getElementById(`edit-date-${taskId}`);
    
    if (task && editInput) {
        const newText = editInput.value.trim();
        if (newText !== task.title || dateInput.value !== task.dueDate) {
            task.title = newText;
            task.dueDate = dateInput.value || null;
            editingTaskId = null;
            renderTasks();
        } else {
            editingTaskId = null;
            renderTasks();
        }
    }
}

// タスク編集をキャンセル
function cancelEdit() {
    editingTaskId = null;
    renderTasks();
}

// サブタスク追加ハンドラ
function handleAddSubtask(parentId) {
    const task = tasks.find(t => t.id === parentId);
    if (task) {
        // 画面トップにスクロール
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 階層レベルをチェック
        const level = getTaskLevel(task);
        if (level >= 3) { // 親が3レベル以上なら、子は4レベル以上になるためブロック
            const suggestionsDiv = document.getElementById('suggestions');
            suggestionsDiv.innerHTML = `
                <div class="error-message" style="color: #dc3545; padding: 10px; background-color: #f8d7da; border-radius: 4px; margin-bottom: 15px;">
                    これ以上深い階層のサブタスクは追加できません。
                </div>
            `;
            return;
        }

        if (task.generationCount >= 3) {
            const suggestionsDiv = document.getElementById('suggestions');
            suggestionsDiv.innerHTML = `
                <div style="color: #dc3545; margin: 15px 0; font-weight: bold; text-align: center;">
                    生成しすぎです、手入力してください
                </div>
            `;
            displayManualSubtaskInput(parentId);
            return;
        }
        generateSubtasks(task.title, parentId);
    }
}

// タスクの階層レベルを取得
function getTaskLevel(task) {
    let level = 0;
    let currentTask = task;
    while (currentTask.parentId) {
        level++;
        currentTask = tasks.find(t => t.id === currentTask.parentId);
    }
    return level;
}

// 完了タスクの表示/非表示を切り替え
function toggleCompletedTasks() {
    hideCompleted = !hideCompleted;
    renderTasks();
}

// タスクをレンダリング
function renderTask(task) {
    if (hideCompleted && task.completed) {
        return '';
    }

    const hasChildren = task.children.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    const childTasks = tasks.filter(t => task.children.includes(t.id));
    const isEditing = editingTaskId === task.id;
    const currentLevel = getTaskLevel(task);
    const canAddSubtask = currentLevel < 3; // 現在のレベルが3未満の場合のみサブタスク追加可能
    
    const priorityInfo = Object.values(PRIORITIES).find(p => p.value === task.priority);
    
    const taskContent = isEditing ? `
        <div class="edit-mode">
            <input type="text" id="edit-input-${task.id}" value="${task.title}"
                onkeypress="if(event.key === 'Enter') saveEdit(${task.id})"
            >
            <input type="date" id="edit-date-${task.id}" value="${task.dueDate || ''}"
                onchange="updateDueDate(${task.id}, this.value)"
            >
            <button onclick="showPriorityChangePopup(${task.id}, ${task.priority})">
                優先度: ${priorityInfo.label}
            </button>
            <div class="edit-buttons">
                <button class="save-btn" onclick="saveEdit(${task.id})">保存</button>
                <button class="cancel-btn" onclick="cancelEdit()">キャンセル</button>
            </div>
        </div>
    ` : `
        <div class="task-text" id="task-${task.id}">
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
            <span class="${task.completed ? 'completed' : ''}" 
                  style="border-left: 3px solid ${priorityInfo.color}; padding-left: 8px;">
                ${task.title}
            </span>
            ${task.dueDate ? `
                <span class="due-date ${getDueDateStatus(task.dueDate)}">
                    期限: ${formatDate(task.dueDate)}
                </span>
            ` : ''}
            ${hasChildren ? `
                <button class="toggle-btn" onclick="toggleExpand(${task.id})">
                    ${isExpanded ? '▼' : '▶'}
                </button>
            ` : ''}
            <span class="priority-indicator" 
                  style="color: ${priorityInfo.color}; cursor: pointer;"
                  onclick="showPriorityChangePopup(${task.id}, ${task.priority})">
                ${priorityInfo.label}
            </span>
        </div>
        <div class="task-buttons">
            <button class="edit-btn" onclick="startEditing(${task.id})">編集</button>
            ${canAddSubtask ? `
                <button class="subtask-btn" onclick="handleAddSubtask(${task.id})">
                    サブタスク追加
                </button>
            ` : ''}
            <button class="delete-btn" onclick="deleteTask(${task.id})">削除</button>
        </div>
    `;

    return `
        <div class="task" style="margin-left: ${currentLevel * 20}px;">
            <div class="task-content">
                ${taskContent}
            </div>
            ${hasChildren && isExpanded ? `
                <div class="subtasks">
                    ${childTasks.map(childTask => renderTask(childTask)).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// 全タスクをレンダリング
function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = tasks
        .filter(task => !task.parentId)
        .map(task => renderTask(task))
        .join('');
}

// 優先度変更用のポップアップを表示
function showPriorityChangePopup(taskId, currentPriority) {
    const modal = document.createElement('div');
    modal.className = 'priority-modal';
    modal.innerHTML = `
        <div class="priority-modal-content">
            <h3>優先度の変更</h3>
            <div class="priority-options">
                ${Object.entries(PRIORITIES).map(([key, priority]) => `
                    <div class="priority-option">
                        <input type="radio" 
                            name="priority" 
                            id="priority-${priority.value}" 
                            value="${priority.value}"
                            ${priority.value === currentPriority ? 'checked' : ''}
                        >
                        <label for="priority-${priority.value}" 
                            style="color: ${priority.color}">
                            ${priority.label}
                        </label>
                    </div>
                `).join('')}
            </div>
            <div class="modal-buttons">
                <button onclick="savePriorityChange(${taskId})">変更を保存</button>
                <button onclick="closePriorityModal()">キャンセル</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 優先度変更を保存
function savePriorityChange(taskId) {
    const task = tasks.find(t => t.id === taskId);
    const selectedPriority = document.querySelector('input[name="priority"]:checked');
    
    if (task && selectedPriority) {
        task.priority = parseInt(selectedPriority.value);
        closePriorityModal();
        renderTasks();
    }
}

// モーダルを閉じる
function closePriorityModal() {
    const modal = document.querySelector('.priority-modal');
    if (modal) {
        modal.remove();
    }
}

function getDueDateStatus(dueDate) {
    if (!dueDate) return null;
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'urgent';
    if (diffDays <= 3) return 'warning';
    return 'normal';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
}

function updateDueDate(taskId, newDate) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.dueDate = newDate || null;
        renderTasks();
    }
}

// Enter キーでタスクを追加
document.getElementById('taskInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// アプリケーションの初期化
initializeApp(); 