const { supabase } = require('../../src/middleware/auth');
const taskController = require('../../src/controllers/task-controller');
const Task = require('../../src/models/task');
const { ApiError } = require('../../src/utils/api-error');

// Mock Task model
jest.mock('../../src/models/task');

// Mock auth middleware
jest.mock('../../src/middleware/auth', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('TaskController', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      user: { id: 1 }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const mockTask = {
        title: 'New Task',
        description: 'Task description'
      };
      mockReq.body = mockTask;

      Task.create.mockResolvedValue({ ...mockTask, id: 1 });

      await taskController.createTask(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining(mockTask)
      });
    });
  });

  describe('getTasks', () => {
    it('should return all tasks for a user', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1' },
        { id: 2, title: 'Task 2' }
      ];

      Task.findAll.mockResolvedValue(mockTasks);

      await taskController.getTasks(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockTasks
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      Task.findAll.mockRejectedValue(error);

      await taskController.getTasks(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Database error',
        statusCode: 500
      }));
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const taskId = 1;
      const updateData = { title: 'Updated Title' };
      mockReq.params.id = taskId;
      mockReq.body = updateData;

      Task.findById.mockResolvedValue({ id: taskId, userId: mockReq.user.id });
      Task.update.mockResolvedValue({ ...updateData, id: taskId });

      await taskController.updateTask(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining(updateData)
      });
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      const taskId = 1;
      mockReq.params.id = taskId;

      Task.findById.mockResolvedValue({ id: taskId, userId: mockReq.user.id });
      Task.delete.mockResolvedValue({ id: taskId });

      await taskController.deleteTask(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Task deleted successfully'
      });
    });
  });
});