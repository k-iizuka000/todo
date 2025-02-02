import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateTask } from '../validators/task-validator.js';
import {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus
} from '../controllers/task-controller.js';

const router = express.Router();

// タスク一覧の取得
router.get('/', authenticateToken, getTasks);

// 特定のタスクの取得
router.get('/:id', authenticateToken, getTask);

// タスクの作成
router.post('/', authenticateToken, validateTask, createTask);

// タスクの更新
router.put('/:id', authenticateToken, validateTask, updateTask);

// タスクの削除
router.delete('/:id', authenticateToken, deleteTask);

// タスクの状態を切り替え
router.patch('/:id/toggle', authenticateToken, toggleTaskStatus);

export default router;