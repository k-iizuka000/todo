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
        data: task
      });
    } catch (error) {
      console.error('Create task error:', error);
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
      console.error('Get tasks error:', error);
      next(new ApiError(500, error.message));
    }
  },

  // Get task by ID
  async getTaskById(req, res, next) {
    try {
      const task = await Task.findById(req.params.id, req.user.id);
      
      if (!task) {
        return next(new ApiError(404, 'タスクが見つかりません'));
      }
      
      res.status(200).json({
        status: 'success',
        data: task
      });
    } catch (error) {
      console.error('Get task by ID error:', error);
      next(new ApiError(500, error.message));
    }
  },

  // Update task
  async updateTask(req, res, next) {
    try {
      const task = await Task.findById(req.params.id, req.user.id);
      
      if (!task) {
        return next(new ApiError(404, 'タスクが見つかりません'));
      }

      const updatedTask = await Task.update(req.params.id, req.body, req.user.id);
      
      res.status(200).json({
        status: 'success',
        data: updatedTask
      });
    } catch (error) {
      console.error('Update task error:', error);
      next(new ApiError(500, error.message));
    }
  },

  // Delete task
  async deleteTask(req, res, next) {
    try {
      const task = await Task.findById(req.params.id, req.user.id);
      
      if (!task) {
        return next(new ApiError(404, 'タスクが見つかりません'));
      }

      await Task.delete(req.params.id, req.user.id);
      
      res.status(200).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      console.error('Delete task error:', error);
      next(new ApiError(500, error.message));
    }
  }
};

module.exports = taskController;