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
        console.log('Request body:', req.body);  // デバッグ用ログ
        const { title } = req.body;

        if (!title) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'タスクのタイトルは必須です'
            });
        }

        console.log('Generating subtasks for title:', title);  // デバッグ用ログ
        const subtasks = await promptManager.generateSubtasks(title);

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

      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new ApiError(401, '認証トークンが必要です'));
      }

      res.status(200).json({
        status: 'success',
        data: task.children || []
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

      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new ApiError(401, '認証トークンが必要です'));
      }
      const subtask = await Task.create({
        title: req.body.title,
        description: req.body.description,
        user_id: req.user.id,
        due_date: null,
        parent_id: parseInt(taskId, 10)
      }, token);

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

      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new ApiError(401, '認証トークンが必要です'));
      }
      const subtask = await Task.findById(id, req.user.id, token);
      if (subtask.parent_id !== parseInt(taskId, 10)) {
        return next(new ApiError(400, 'サブタスクは指定されたタスクに属していません'));
      }

      const { isValid, errors } = validateSubTask({ ...req.body, taskId });
      if (!isValid) {
        return next(new ApiError(400, errors.join(', ')));
      }

      const updatedSubtask = await Task.update(id, req.user.id, req.body, token);
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

      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new ApiError(401, '認証トークンが必要です'));
      }
      const subtask = await Task.findById(id, req.user.id, token);
      if (subtask.parent_id !== parseInt(taskId, 10)) {
        return next(new ApiError(400, 'サブタスクは指定されたタスクに属していません'));
      }

      await Task.delete(id, req.user.id, token);
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

      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new ApiError(401, '認証トークンが必要です'));
      }
      const subtask = await Task.findById(id, req.user.id, token);
      if (subtask.parent_id !== parseInt(taskId, 10)) {
        return next(new ApiError(400, 'サブタスクは指定されたタスクに属していません'));
      }

      const newStatus = subtask.status === 'pending' ? 'done' : 'pending';
      const updatedSubtask = await Task.update(id, req.user.id, { status: newStatus }, token);
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