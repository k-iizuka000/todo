const Task = require('../models/task');
const { ApiError } = require('../utils/api-error');

const taskController = {
  // Create new task
  async createTask(req, res, next) {
    try {
      const taskData = {
        ...req.body,
        userId: req.user.id
      };

      const task = await Task.create(taskData);
      
      res.status(201).json({
        status: 'success',
        data: {
          ...task,
          ...taskData
        }
      });
    } catch (error) {
      next(new ApiError(500, error.message));
    }
  },

  // Get all tasks for a user
  async getTasks(req, res, next) {
    try {
      const tasks = await Task.findAll(req.user.id);
      
      res.status(200).json({
        status: 'success',
        data: tasks
      });
    } catch (error) {
      next(new ApiError(500, error.message));
    }
  },

  // Get task by ID
  async getTaskById(req, res, next) {
    try {
      const task = await Task.findById(req.params.id);
      
      if (!task) {
        return next(new ApiError(404, 'タスクが見つかりません'));
      }

      if (task.userId !== req.user.id) {
        return next(new ApiError(403, 'このタスクにアクセスする権限がありません'));
      }
      
      res.status(200).json({
        status: 'success',
        data: task
      });
    } catch (error) {
      next(new ApiError(500, error.message));
    }
  },

  // Update task
  async updateTask(req, res, next) {
    try {
      const task = await Task.findById(req.params.id);
      
      if (!task) {
        return next(new ApiError(404, 'タスクが見つかりません'));
      }

      if (task.userId !== req.user.id) {
        return next(new ApiError(403, 'このタスクにアクセスする権限がありません'));
      }

      const updatedTask = await Task.update(req.params.id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: updatedTask
      });
    } catch (error) {
      next(new ApiError(500, error.message));
    }
  },

  // Delete task
  async deleteTask(req, res, next) {
    try {
      const task = await Task.findById(req.params.id);
      
      if (!task) {
        return next(new ApiError(404, 'タスクが見つかりません'));
      }

      if (task.userId !== req.user.id) {
        return next(new ApiError(403, 'このタスクにアクセスする権限がありません'));
      }

      await Task.delete(req.params.id);
      
      res.status(200).json({
        status: 'success',
        message: 'Task deleted successfully'
      });
    } catch (error) {
      next(new ApiError(500, error.message));
    }
  }
};

module.exports = taskController;