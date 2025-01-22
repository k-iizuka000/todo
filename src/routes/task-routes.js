const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const taskController = require('../controllers/task-controller');
const validateTask = require('../middleware/validateTask');

// Task routes with authentication and validation
router.get('/', auth, taskController.getTasks);
router.get('/:id', auth, taskController.getTaskById);
router.post('/', auth, validateTask, taskController.createTask);
router.put('/:id', auth, validateTask, taskController.updateTask);
router.delete('/:id', auth, taskController.deleteTask);

// Error handling for task routes
router.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    status: 'error',
    error: {
      message: err.message || 'Internal server error'
    }
  });
});

module.exports = router;