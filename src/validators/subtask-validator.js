const validateSubTask = (subtask, isToggleOperation = false) => {
  const errors = [];

  // トグル操作の場合はタイトルのバリデーションをスキップ
  if (!isToggleOperation) {
    if (!subtask.title) {
      errors.push('サブタスクのタイトルは必須です');
    }

    if (subtask.title && subtask.title.length > 100) {
      errors.push('サブタスクのタイトルは100文字以内である必要があります');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateSubTask
}; 