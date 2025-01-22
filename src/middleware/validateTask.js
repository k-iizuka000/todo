const { ApiError } = require('../utils/api-error');

const validateTask = (req, res, next) => {
  const { title } = req.body;

  if (!title) {
    return next(new ApiError(400, 'タイトルは必須です'));
  }

  next();
};

module.exports = validateTask; 