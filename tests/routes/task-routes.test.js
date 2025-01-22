const request = require('supertest');
const express = require('express');
const taskRoutes = require('../../src/routes/task-routes');
const { auth } = require('../../src/middleware/auth');
const { errorHandler } = require('../../src/middleware/error-handler');

// Auth middlewareのモック
jest.mock('../../src/middleware/auth', () => ({
  auth: jest.fn((req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  })
}));

describe('Task Routes Integration', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/tasks', taskRoutes);
    app.use(errorHandler);
  });

  describe('GET /api/tasks', () => {
    it('should require authentication', async () => {
      auth.mockImplementationOnce((req, res, next) => {
        const error = new Error('認証が必要です');
        error.statusCode = 401;
        next(error);
      });

      const response = await request(app).get('/api/tasks');
      expect(response.status).toBe(401);
    });

    it('should return tasks when authenticated', async () => {
      const response = await request(app).get('/api/tasks');
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
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toMatchObject(taskData);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });
});