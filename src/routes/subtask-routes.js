const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const subtaskController = require('../controllers/subtask-controller');

// サブタスク一覧の取得
router.get('/:taskId/subtasks', auth, subtaskController.getSubtasks);

// サブタスクの生成
router.post('/generate', subtaskController.generateSubtasks);

// サブタスクの作成
router.post('/:taskId/subtasks', auth, subtaskController.createSubtask);

// サブタスクの更新
router.put('/:taskId/subtasks/:id', auth, subtaskController.updateSubtask);

// サブタスクの削除
router.delete('/:taskId/subtasks/:id', auth, subtaskController.deleteSubtask);

// サブタスクの完了状態の切り替え
router.patch('/:taskId/subtasks/:id/toggle', auth, subtaskController.toggleComplete);

module.exports = router;