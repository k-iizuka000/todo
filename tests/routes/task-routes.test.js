const request = require('supertest');
const express = require('express');
const taskRoutes = require('../../src/routes/task-routes');
const { auth } = require('../../src/middleware/auth');
const { errorHandler } = require('../../src/middleware/error-handler');
const { AuthenticationError } = require('../../src/utils/errors');
const Task = require('../../src/models/task');

// Mock Task model
jest.mock('../../src/models/task');

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

describe('Task Routes Integration', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/tasks', taskRoutes);
    app.use(errorHandler);

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    Task.create.mockResolvedValue({
      id: 1,
      title: 'Test Task',
      description: 'Test Description',
      userId: 1
    });

    Task.findAll.mockResolvedValue([
      {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        userId: 1
      }
    ]);
  });

  describe('GET /api/tasks', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/tasks');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return tasks when authenticated', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer test-token')
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toMatchObject(taskData);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', 'Bearer test-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });
});