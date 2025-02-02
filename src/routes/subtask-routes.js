import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import subtaskController from '../controllers/subtask-controller.js';

const router = express.Router();

// サブタスク一覧の取得
router.get('/:taskId/subtasks', authenticateToken, subtaskController.getSubtasks);

// サブタスクの生成
router.post('/generate', authenticateToken, subtaskController.generateSubtasks);

// サブタスクの作成
router.post('/:taskId/subtasks', authenticateToken, subtaskController.createSubtask);

// サブタスクの更新
router.put('/:taskId/subtasks/:id', authenticateToken, subtaskController.updateSubtask);

// サブタスクの削除
router.delete('/:taskId/subtasks/:id', authenticateToken, subtaskController.deleteSubtask);

// サブタスクの完了状態の切り替え
router.patch('/:taskId/subtasks/:id/toggle', authenticateToken, subtaskController.toggleComplete);

export default router;