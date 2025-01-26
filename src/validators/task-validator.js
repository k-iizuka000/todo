// タスクのバリデーション
export const validateTask = (req, res, next) => {
  const { title, description, status, dueDate } = req.body;

  // タイトルのバリデーション
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ message: 'タイトルは必須です' });
  }
  if (title.length > 255) {
    return res.status(400).json({ message: 'タイトルは255文字以内で入力してください' });
  }

  // 説明のバリデーション（任意）
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ message: '説明は文字列で入力してください' });
  }

  // ステータスのバリデーション（更新時のみ）
  if (status !== undefined) {
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'ステータスは pending, in_progress, completed のいずれかを指定してください' 
      });
    }
  }

  // 期限日のバリデーション（任意）
  if (dueDate !== undefined && dueDate !== null) {
    const date = new Date(dueDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: '期限日の形式が正しくありません' });
    }
  }

  next();
}; 