const promptManager = require('../utils/prompt-manager');
const SubTask = require('../models/subtask');
const { validateSubTask } = require('../validators/subtask-validator');
const { ApiError } = require('../utils/errors');
const Task = require('../models/task');

class SubTaskController {
  // Create new subtask
  async create(req, res) {
    try {
      const { taskId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      // タスクの所有者確認
      const task = await Task.findById(taskId, userId);
      if (!task) {
        return res.status(404).json({ error: 'タスクが見つかりません' });
      }

      if (!content) {
        return res.status(400).json({ error: '内容は必須です' });
      }

      const subtask = await SubTask.create({ taskId, content });
      res.status(201).json(subtask);
    } catch (error) {
      console.error('サブタスク作成エラー:', error);
      res.status(500).json({ error: 'サブタスクの作成に失敗しました' });
    }
  }

  // Get subtask by ID
  async getSubTask(req, res, next) {
    try {
      const subtask = await SubTask.findById(req.params.id);
      if (!subtask) {
        throw new ApiError(404, 'Subtask not found');
      }
      res.json(subtask);
    } catch (error) {
      next(error);
    }
  }

  // Update subtask
  async update(req, res) {
    try {
      const { id } = req.params;
      const { content, isCompleted } = req.body;

      const subtask = await SubTask.update(id, { content, isCompleted });
      if (!subtask) {
        return res.status(404).json({ error: 'サブタスクが見つかりません' });
      }

      res.json(subtask);
    } catch (error) {
      console.error('サブタスク更新エラー:', error);
      res.status(500).json({ error: 'サブタスクの更新に失敗しました' });
    }
  }

  // Delete subtask
  async delete(req, res) {
    try {
      const { id } = req.params;

      const subtask = await SubTask.delete(id);
      if (!subtask) {
        return res.status(404).json({ error: 'サブタスクが見つかりません' });
      }

      res.json({ message: 'サブタスクを削除しました' });
    } catch (error) {
      console.error('サブタスク削除エラー:', error);
      res.status(500).json({ error: 'サブタスクの削除に失敗しました' });
    }
  }

  async toggleComplete(req, res) {
    try {
      const { id } = req.params;

      const subtask = await SubTask.toggleComplete(id);
      if (!subtask) {
        return res.status(404).json({ error: 'サブタスクが見つかりません' });
      }

      res.json(subtask);
    } catch (error) {
      console.error('サブタスク更新エラー:', error);
      res.status(500).json({ error: 'サブタスクの更新に失敗しました' });
    }
  }

  async getByTaskId(req, res) {
    try {
      const { taskId } = req.params;
      const userId = req.user.id;

      // タスクの所有者確認
      const task = await Task.findById(taskId, userId);
      if (!task) {
        return res.status(404).json({ error: 'タスクが見つかりません' });
      }

      const subtasks = await SubTask.findByTaskId(taskId);
      res.json(subtasks);
    } catch (error) {
      console.error('サブタスク取得エラー:', error);
      res.status(500).json({ error: 'サブタスクの取得に失敗しました' });
    }
  }
}

module.exports = new SubTaskController(); 