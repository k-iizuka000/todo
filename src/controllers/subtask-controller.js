import { StatusCodes } from 'http-status-codes';
import SubTask from '../models/subtask.js';
import { validateSubTask } from '../validators/subtask-validator.js';
import { ApiError } from '../utils/errors.js';
import Task from '../models/task.js';
import { PromptManager } from '../utils/prompt-manager.js';

const promptManager = new PromptManager();

class SubTaskController {
  // サブタスク生成
  async generateSubtasks(req, res, next) {
    try {
      const { taskTitle, taskDescription } = req.body;

      if (!taskTitle) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'タスクのタイトルは必須です'
        });
      }

      const subtasks = await promptManager.generateSubtasks(taskTitle, taskDescription);

      return res.status(StatusCodes.OK).json({
        success: true,
        subtasks: subtasks
      });

    } catch (error) {
      console.error('サブタスク生成エラー:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'サブタスクの生成に失敗しました'
      });
    }
  }

  // サブタスク一覧の取得
  async getSubtasks(req, res, next) {
    try {
      const { taskId } = req.params;
      const task = await Task.findById(taskId);

      if (!task) {
        return next(new ApiError(404, 'タスクが見つかりません'));
      }

      if (task.userId !== req.user.id) {
        return next(new ApiError(403, 'このタスクへのアクセス権がありません'));
      }

      const subtasks = await SubTask.findByTaskId(taskId);
      res.status(200).json({
        status: 'success',
        data: subtasks
      });
    } catch (error) {
      next(new ApiError(500, error.message));
    }
  }

  // サブタスクの作成
  async createSubtask(req, res, next) {
    try {
      const { taskId } = req.params;
      const task = await Task.findById(taskId);

      if (!task) {
        return next(new ApiError(404, 'タスクが見つかりません'));
      }

      if (task.userId !== req.user.id) {
        return next(new ApiError(403, 'このタスクへのアクセス権がありません'));
      }

      const { isValid, errors } = validateSubTask({ ...req.body, taskId });
      if (!isValid) {
        return next(new ApiError(400, errors.join(', ')));
      }

      const subtask = await SubTask.create({
        ...req.body,
        taskId: taskId
      });

      res.status(201).json({
        status: 'success',
        data: subtask
      });
    } catch (error) {
      next(new ApiError(500, error.message));
    }
  }

  // サブタスクの更新
  async updateSubtask(req, res, next) {
    try {
      const { taskId, id } = req.params;
      const task = await Task.findById(taskId);

      if (!task) {
        return next(new ApiError(404, 'タスクが見つかりません'));
      }

      if (task.userId !== req.user.id) {
        return next(new ApiError(403, 'このタスクへのアクセス権がありません'));
      }

      const subtask = await SubTask.findById(id);
      if (!subtask) {
        return next(new ApiError(404, 'サブタスクが見つかりません'));
      }

      if (subtask.taskId !== taskId) {
        return next(new ApiError(400, 'サブタスクは指定されたタスクに属していません'));
      }

      const { isValid, errors } = validateSubTask({ ...req.body, taskId });
      if (!isValid) {
        return next(new ApiError(400, errors.join(', ')));
      }

      const updatedSubtask = await SubTask.update(id, req.body);
      res.status(200).json({
        status: 'success',
        data: updatedSubtask
      });
    } catch (error) {
      next(new ApiError(500, error.message));
    }
  }

  // サブタスクの削除
  async deleteSubtask(req, res, next) {
    try {
      const { taskId, id } = req.params;
      const task = await Task.findById(taskId);

      if (!task) {
        return next(new ApiError(404, 'タスクが見つかりません'));
      }

      if (task.userId !== req.user.id) {
        return next(new ApiError(403, 'このタスクへのアクセス権がありません'));
      }

      const subtask = await SubTask.findById(id);
      if (!subtask) {
        return next(new ApiError(404, 'サブタスクが見つかりません'));
      }

      if (subtask.taskId !== taskId) {
        return next(new ApiError(400, 'サブタスクは指定されたタスクに属していません'));
      }

      await SubTask.delete(id);
      res.status(200).json({
        status: 'success',
        message: 'サブタスクが削除されました'
      });
    } catch (error) {
      next(new ApiError(500, error.message));
    }
  }

  // サブタスクの完了状態の切り替え
  async toggleComplete(req, res, next) {
    try {
      const { taskId, id } = req.params;
      const task = await Task.findById(taskId);

      if (!task) {
        return next(new ApiError(404, 'タスクが見つかりません'));
      }

      if (task.userId !== req.user.id) {
        return next(new ApiError(403, 'このタスクへのアクセス権がありません'));
      }

      const subtask = await SubTask.findById(id);
      if (!subtask) {
        return next(new ApiError(404, 'サブタスクが見つかりません'));
      }

      if (subtask.taskId !== parseInt(taskId)) {
        return next(new ApiError(400, 'サブタスクは指定されたタスクに属していません'));
      }

      const updatedSubtask = await SubTask.toggleComplete(id);
      res.status(200).json({
        status: 'success',
        data: updatedSubtask
      });
    } catch (error) {
      next(new ApiError(500, error.message));
    }
  }
}

export default new SubTaskController(); 