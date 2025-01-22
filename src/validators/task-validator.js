const validateTask = (task) => {
  const errors = [];

  if (!task.title) {
    errors.push('タイトルは必須です');
  }

  if (task.title && task.title.length > 100) {
    errors.push('タイトルは100文字以内である必要があります');
  }

  if (task.description && task.description.length > 500) {
    errors.push('説明は500文字以内である必要があります');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateTask
}; 