const Task = require('../models/task');
const { validateTask } = require('../validators/task-validator');
const ApiError = require('../utils/api-error');

class TaskController {
  // Create new task
  async create(req, res) {
    try {
      const { title, description } = req.body;
      const userId = req.user.id; // 認証ミドルウェアから取得

      if (!title) {
        return res.status(400).json({ error: 'タイトルは必須です' });
      }

      const task = await Task.create({ title, description, userId });
      res.status(201).json(task);
    } catch (error) {
      console.error('タスク作成エラー:', error);
      res.status(500).json({ error: 'タスクの作成に失敗しました' });
    }
  }

  // Get all tasks for user
  async getAll(req, res) {
    try {
      const userId = req.user.id;
      const tasks = await Task.findAll(userId);
      res.json(tasks);
    } catch (error) {
      console.error('タスク一覧取得エラー:', error);
      res.status(500).json({ error: 'タスクの取得に失敗しました' });
    }
  }

  // Get single task
  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const task = await Task.findById(id, userId);
      if (!task) {
        return res.status(404).json({ error: 'タスクが見つかりません' });
      }
      
      res.json(task);
    } catch (error) {
      console.error('タスク取得エラー:', error);
      res.status(500).json({ error: 'タスクの取得に失敗しました' });
    }
  }

  // Update task
  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, description, status } = req.body;
      const userId = req.user.id;

      const task = await Task.update(id, { title, description, status }, userId);
      if (!task) {
        return res.status(404).json({ error: 'タスクが見つかりません' });
      }

      res.json(task);
    } catch (error) {
      console.error('タスク更新エラー:', error);
      res.status(500).json({ error: 'タスクの更新に失敗しました' });
    }
  }

  // Delete task
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const task = await Task.delete(id, userId);
      if (!task) {
        return res.status(404).json({ error: 'タスクが見つかりません' });
      }

      res.json({ message: 'タスクを削除しました' });
    } catch (error) {
      console.error('タスク削除エラー:', error);
      res.status(500).json({ error: 'タスクの削除に失敗しました' });
    }
  }
}

module.exports = new TaskController();