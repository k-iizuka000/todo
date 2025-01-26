import express from 'express';
import Task from '../models/task.js';
import { validateTask } from '../validators/task-validator.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// 全てのルートで認証を必要とする
router.use(authenticateUser);

// タスク一覧の取得
router.get('/', async (req, res, next) => {
  try {
    const tasks = await Task.findAll(req.user.id);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// 特定のタスクの取得
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id, req.user.id);
    if (!task) {
      return res.status(404).json({ message: 'タスクが見つかりません' });
    }
    res.json(task);
  } catch (error) {
    next(error);
  }
});

// タスクの作成
router.post('/', validateTask, async (req, res, next) => {
  try {
    const { title, description, dueDate } = req.body;
    const task = await Task.create({
      title,
      description,
      userId: req.user.id,
      dueDate: dueDate ? new Date(dueDate) : null
    });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// タスクの更新
router.put('/:id', validateTask, async (req, res, next) => {
  try {
    const updates = {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null
    };

    // 無効な値を削除
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined || updates[key] === null) {
        delete updates[key];
      }
    });

    const task = await Task.update(req.params.id, req.user.id, updates);
    if (!task) {
      return res.status(404).json({ message: 'タスクが見つかりません' });
    }
    res.json(task);
  } catch (error) {
    next(error);
  }
});

// タスクの削除
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.delete(req.params.id, req.user.id);
    if (!task) {
      return res.status(404).json({ message: 'タスクが見つかりません' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;