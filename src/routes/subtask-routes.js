const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const subtaskController = require('../controllers/subtask-controller');

// サブタスク一覧の取得
router.get('/tasks/:taskId/subtasks', auth, subtaskController.getSubtasks);

// サブタスクの作成
router.post('/tasks/:taskId/subtasks', auth, subtaskController.createSubtask);

// サブタスクの更新
router.put('/subtasks/:id', auth, subtaskController.updateSubtask);

// サブタスクの削除
router.delete('/subtasks/:id', auth, subtaskController.deleteSubtask);

module.exports = router;