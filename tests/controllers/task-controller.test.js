const { supabase } = require('../../src/middleware/auth');
const taskController = require('../../src/controllers/task-controller');
const Task = require('../../models/task');
const mongoose = require('mongoose');

// Mock Task model
jest.mock('../../models/task');

// モックの設定
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
      user: { id: 'test-user-id' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const mockTask = {
        title: 'New Task',
        description: 'Task description'
      };
      mockReq.body = mockTask;

      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{ ...mockTask, id: 1 }],
            error: null
          })
        })
      });

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

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockTasks,
            error: null
          })
        })
      });

      await taskController.getTasks(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockTasks
      });
    });

    it('should handle errors', async () => {
      const mockError = new Error('Database error');

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: mockError
          })
        })
      });

      await taskController.getTasks(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const taskId = 'test-task-id';
      const updateData = { title: 'Updated Title' };
      
      mockReq.params.id = taskId;
      mockReq.body = updateData;
      
      Task.findByIdAndUpdate.mockResolvedValue(updateData);
      
      await taskController.updateTask(mockReq, mockRes);
      
      expect(Task.findByIdAndUpdate).toHaveBeenCalledWith(
        taskId,
        updateData,
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalledWith(updateData);
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      const taskId = 'test-task-id';
      mockReq.params.id = taskId;
      
      Task.findByIdAndDelete.mockResolvedValue({ _id: taskId });
      
      await taskController.deleteTask(mockReq, mockRes);
      
      expect(Task.findByIdAndDelete).toHaveBeenCalledWith(taskId);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});