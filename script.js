// APIキーをサーバーから取得
async function loadApiKey() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        return data.apiKey;
    } catch (error) {
        console.error('Error loading API key:', error);
        return '';
    }
}

let API_KEY = '';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
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
        this.text = text;
        this.completed = false;
        this.parentId = parentId;
        this.children = [];
        this.priority = PRIORITIES.NORMAL.value;
        this.dueDate = null;
    }
}

// 初期化時にAPIキーを設定
async function initializeApp() {
    API_KEY = await loadApiKey();
    if (!API_KEY) {
        console.error('APIキーが設定されていません');
    }
}

// Gemini APIを使用してサブタスクを生成
async function generateSubtasks(taskText, parentTaskId) {
    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <span>AIがサブタスクを考えています...</span>
        </div>
    `;
    suggestionsDiv.style.display = 'block';

    try {
        if (!API_KEY) {
            API_KEY = await loadApiKey();
        }

        if (!API_KEY) {
            throw new Error('APIキーが設定されていません');
        }

        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `
'あなたはTODOリストのアシスタントです。
以下のタスクを達成するために「何をした方が良いか」を示す3つのサブタスクを提案してください。
サブタスクは実用的で具体的であり、行動を示す動詞を用いて表現してください。
文章にせず、箇条書きで出力してください。
また、卑猥な言葉や犯罪行為を助長するような表現、悪いことを斡旋するような内容は含めないでください。


タスク: ${taskText}

サブタスクは以下の形式で出力してください（必ず各行を「- 」で始めてください）:

- サブタスク1
- サブタスク2
- サブタスク3'`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const subtasks = data.candidates[0].content.parts[0].text
                .split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map(line => line.trim().replace(/^- /, ''));

            displaySuggestions(subtasks, parentTaskId);
        } else {
            throw new Error('Invalid API response format');
        }
    } catch (error) {
        console.error('Error generating suggestions:', error);
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
                        ${parentTask.text}
                    </span>
                    <span style="color: ${priorityInfo.color}; font-size: 0.9em; padding: 2px 8px; border: 1px solid ${priorityInfo.color}; border-radius: 4px;">
                        ${priorityInfo.label}
                    </span>
                </div>
            </div>
            <h3>AIが提案する関連タスク:</h3>
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
                    ${parentTask.text}
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
        const newTask = new Task(taskText, parentId);
        newTask.dueDate = dueDateInput.value || null;
        
        if (parentId) {
            const parentTask = tasks.find(t => t.id === parentId);
            if (parentTask) {
                parentTask.children.push(newTask.id);
                expandedTasks.add(parentId);
                const suggestionsDiv = document.getElementById('suggestions');
                suggestionsDiv.style.display = 'none';
            }
        }
        
        tasks.push(newTask);
        renderTasks();
        input.value = '';
        dueDateInput.value = '';

        if (!text && !parentId) {
            generateSubtasks(taskText, newTask.id);
        }
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
        function getAllChildIds(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return [];
            const childIds = task.children.flatMap(childId => getAllChildIds(childId));
            return [taskId, ...childIds];
        }

        const idsToDelete = getAllChildIds(id);
        tasks = tasks.filter(t => !idsToDelete.includes(t.id));
        
        const taskToDelete = tasks.find(t => t.id === id);
        if (taskToDelete && taskToDelete.parentId) {
            const parentTask = tasks.find(t => t.id === taskToDelete.parentId);
            if (parentTask) {
                parentTask.children = parentTask.children.filter(childId => childId !== id);
            }
        }
        
        renderTasks();
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
        if (newText !== task.text || dateInput.value !== task.dueDate) {
            task.text = newText;
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
        generateSubtasks(task.text, parentId);
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
    
    const priorityInfo = Object.values(PRIORITIES).find(p => p.value === task.priority);
    
    const taskContent = isEditing ? `
        <div class="edit-mode">
            <input type="text" id="edit-input-${task.id}" value="${task.text}"
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
        <div class="task-text">
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
            <span class="${task.completed ? 'completed' : ''}" 
                  style="border-left: 3px solid ${priorityInfo.color}; padding-left: 8px;">
                ${task.text}
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
            <button class="subtask-btn" onclick="handleAddSubtask(${task.id})">
                サブタスク追加
            </button>
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