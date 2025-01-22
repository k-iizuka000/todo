const request = require('supertest');
const { createServer } = require('http');
const express = require('express');
const { auth } = require('../../src/middleware/auth');
const taskRoutes = require('../../src/routes/task-routes');
const subtaskRoutes = require('../../src/routes/subtask-routes');
const { errorHandler } = require('../../src/middleware/error-handler');

jest.mock('../../src/middleware/auth', () => ({
  auth: jest.fn((req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  })
}));

describe('API Integration Tests', () => {
  let app;
  let server;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/tasks', taskRoutes);
    app.use('/api', subtaskRoutes);
    app.use(errorHandler);
    server = createServer(app);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Tasks API', () => {
    it('should create and retrieve a task', async () => {
      const taskData = {
        title: 'Integration Test Task',
        description: 'Testing the full API flow'
      };

      // タスクの作成
      const createResponse = await request(app)
        .post('/api/tasks')
        .send(taskData);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data).toMatchObject(taskData);

      const taskId = createResponse.body.data.id;

      // タスクの取得
      const getResponse = await request(app)
        .get(`/api/tasks/${taskId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data).toMatchObject(taskData);
    });

    it('should handle task updates', async () => {
      const taskData = {
        title: 'Task to Update',
        description: 'Will be updated'
      };

      // タスクの作成
      const createResponse = await request(app)
        .post('/api/tasks')
        .send(taskData);

      const taskId = createResponse.body.data.id;
      const updateData = {
        title: 'Updated Task Title'
      };

      // タスクの更新
      const updateResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.title).toBe(updateData.title);
    });
  });

  describe('Subtasks API', () => {
    it('should create and manage subtasks', async () => {
      // 親タスクの作成
      const taskResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Parent Task',
          description: 'Task with subtasks'
        });

      const taskId = taskResponse.body.data.id;

      // サブタスクの作成
      const subtaskData = {
        content: 'Test Subtask'
      };

      const createSubtaskResponse = await request(app)
        .post(`/api/tasks/${taskId}/subtasks`)
        .send(subtaskData);

      expect(createSubtaskResponse.status).toBe(201);
      expect(createSubtaskResponse.body.data).toMatchObject(subtaskData);

      // サブタスクの取得
      const getSubtasksResponse = await request(app)
        .get(`/api/tasks/${taskId}/subtasks`);

      expect(getSubtasksResponse.status).toBe(200);
      expect(getSubtasksResponse.body.data).toHaveLength(1);
    });
  });
});