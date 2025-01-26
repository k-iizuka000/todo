問題点
```
画面で確認すると、リロードしたらタスクが表示されません。（消える）
原因の調査をお願いします
```

- public/gemini-todo.htmlでは、ページ読み込み時にタスクを取得する処理が実装されていません。
- public/js/script.jsでは、タスクデータをローカルの配列（let tasks = [];）で管理していますが、APIからのデータ取得と同期が行われていません。


- 日付形式をISO 8601形式（YYYY-MM-DDTHH:mm:ssZ）に変換



下記は前任者のコードです。
--------------------------------

# タスクの編集機能の修正
```
// タスクの編集を保存
async function saveEdit(taskId) {
    const task = tasks.find(t => t.id === taskId);
    const editInput = document.getElementById(`edit-input-${taskId}`);
    const dateInput = document.getElementById(`edit-date-${taskId}`);
    
    if (task && editInput) {
        try {
            const token = localStorage.getItem('token');
            const newText = editInput.value.trim();
            const dueDate = dateInput.value ? 
                new Date(dateInput.value + 'T00:00:00Z').toISOString() : null;

            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...task,
                    title: newText,
                    dueDate: dueDate
                })
            });

            if (!response.ok) {
                throw new Error('タスクの更新に失敗しました');
            }

            await fetchTasks();
            editingTaskId = null;
        } catch (error) {
            console.error('Error updating task:', error);
            alert(error.message);
        }
    }
}
```

# 優先度変更の修正
```
// 優先度変更を保存
async function savePriorityChange(taskId) {
    const task = tasks.find(t => t.id === taskId);
    const selectedPriority = document.querySelector('input[name="priority"]:checked');
    
    if (task && selectedPriority) {
        try {
            const token = localStorage.getItem('token');
            const newPriority = parseInt(selectedPriority.value);

            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...task,
                    priority: newPriority
                })
            });

            if (!response.ok) {
                throw new Error('優先度の更新に失敗しました');
            }

            await fetchTasks();
            closePriorityModal();
        } catch (error) {
            console.error('Error updating priority:', error);
            alert(error.message);
        }
    }
}
```

# 期限日の更新処理の修正
```
// 期限日を更新
async function updateDueDate(taskId, newDate) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        try {
            const token = localStorage.getItem('token');
            const dueDate = newDate ? 
                new Date(newDate + 'T00:00:00Z').toISOString() : null;

            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...task,
                    dueDate: dueDate
                })
            });

            if (!response.ok) {
                throw new Error('期限日の更新に失敗しました');
            }

            await fetchTasks();
        } catch (error) {
            console.error('Error updating due date:', error);
            alert(error.message);
        }
    }
}
```

これらの関数は、既存のコードに追加する形で実装してください。主な変更点は：
1. 各更新処理をAPI連携するように非同期処理に変更
2. トークンベースの認証の追加
3. エラーハンドリングの追加
4. 更新後のタスク一覧の再取得




