const request = require('supertest');
const express = require('express');
const taskRoutes = require('../../src/routes/task-routes');
const subtaskRoutes = require('../../src/routes/subtask-routes');
const { auth } = require('../../src/middleware/auth');
const { errorHandler } = require('../../src/middleware/error-handler');
const { AuthenticationError } = require('../../src/utils/errors');
const Task = require('../../src/models/task');
const Subtask = require('../../src/models/subtask');

// Mock Task and Subtask models
jest.mock('../../src/models/task');
jest.mock('../../src/models/subtask', () => {
  return {
    create: jest.fn(),
    findByTaskId: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    toggleComplete: jest.fn()
  };
});

// Mock auth middleware
jest.mock('../../src/middleware/auth', () => {
  const { AuthenticationError } = require('../../src/utils/errors');
  return {
    auth: jest.fn((req, res, next) => {
      if (!req.headers.authorization) {
        return next(new AuthenticationError());
      }
      req.user = { id: 1 };
      next();
    })
  };
});

describe('API Integration Tests', () => {
  let app;
  const authToken = 'Bearer test-token';

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/tasks', taskRoutes);
    app.use('/api/tasks', subtaskRoutes);
    app.use(errorHandler);

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    Task.create.mockImplementation((data) => ({
      id: 1,
      ...data,
      userId: 1
    }));

    Task.findAll.mockResolvedValue([
      {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        userId: 1
      }
    ]);

    Task.findById.mockImplementation((id) => ({
      id,
      title: 'Integration Test Task',
      description: 'Testing the full task flow',
      userId: 1
    }));

    Task.update.mockResolvedValue({
      id: 1,
      title: 'Updated Task Title',
      description: 'Test Description',
      userId: 1
    });

    Subtask.create.mockResolvedValue({
      id: 1,
      title: 'Test Subtask',
      taskId: 1,
      completed: false
    });

    Subtask.findByTaskId.mockResolvedValue([
      {
        id: 1,
        title: 'Test Subtask',
        taskId: 1,
        completed: false
      }
    ]);

    Subtask.findById.mockImplementation((id) => ({
      id,
      title: 'Test Subtask',
      taskId: 1,
      completed: false
    }));

    Subtask.update.mockResolvedValue({
      id: 1,
      title: 'Test Subtask',
      taskId: 1,
      completed: true
    });

    Subtask.toggleComplete.mockResolvedValue({
      id: 1,
      title: 'Test Subtask',
      taskId: 1,
      completed: true
    });
  });

  describe('Authentication', () => {
    it('should require authentication for protected routes', async () => {
      const response = await request(app).get('/api/tasks');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    }, 10000);

    it('should allow access with valid authentication', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', authToken);
      
      expect(response.status).toBe(200);
    }, 10000);
  });

  describe('Tasks API', () => {
    it('should create and retrieve a task', async () => {
      const taskData = {
        title: 'Integration Test Task',
        description: 'Testing the full task flow'
      };

      // Create task
      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', authToken)
        .send(taskData);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data).toMatchObject(taskData);

      const taskId = createResponse.body.data.id;

      // Get task
      const getResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', authToken);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data).toMatchObject(taskData);
    }, 10000);

    it('should handle task updates', async () => {
      const taskData = {
        title: 'Task to Update',
        description: 'This will be updated'
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', authToken)
        .send(taskData);

      const taskId = createResponse.body.data.id;
      const updateData = {
        title: 'Updated Task Title'
      };

      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', authToken)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.title).toBe(updateData.title);
    }, 10000);
  });

  describe('Subtasks API', () => {
    it('should create and manage subtasks', async () => {
      // まず親タスクを作成
      const taskData = {
        title: 'Parent Task',
        description: 'Task for subtask test'
      };

      const createTaskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', authToken)
        .send(taskData);

      expect(createTaskResponse.status).toBe(201);
      const taskId = createTaskResponse.body.data.id;

      const subtaskData = {
        title: 'Test Subtask',
        description: 'Test subtask description'
      };

      // サブタスクを作成
      const createSubtaskResponse = await request(app)
        .post(`/api/tasks/${taskId}/subtasks`)
        .set('Authorization', authToken)
        .send(subtaskData);

      expect(createSubtaskResponse.status).toBe(201);
      expect(createSubtaskResponse.body.data.title).toBe(subtaskData.title);

      const subtaskId = createSubtaskResponse.body.data.id;

      // サブタスクの完了状態を切り替え
      const toggleResponse = await request(app)
        .patch(`/api/tasks/${taskId}/subtasks/${subtaskId}/toggle`)
        .set('Authorization', authToken);

      expect(toggleResponse.status).toBe(200);
      expect(toggleResponse.body.data.completed).toBe(true);
    }, 10000);
  });
});