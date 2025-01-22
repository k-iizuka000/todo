const Task = require('../../src/models/task');
const db = require('../../src/models/db');

// モックデータ
const mockTask = {
  title: 'テストタスク',
  description: 'テストの説明',
  userId: 1
};

describe('Task Model', () => {
  beforeEach(() => {
    // データベースのクエリ結果をモック
    jest.spyOn(db, 'query').mockImplementation(() => ({
      rows: [{ id: 1, ...mockTask }]
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const task = await Task.create(mockTask);
      expect(task).toHaveProperty('id', 1);
      expect(task.title).toBe(mockTask.title);
      expect(task.description).toBe(mockTask.description);
      expect(task.userId).toBe(mockTask.userId);
    });
  });

  describe('findAll', () => {
    it('should return all tasks for a user', async () => {
      const tasks = await Task.findAll(mockTask.userId);
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks[0]).toHaveProperty('id');
    });
  });

  describe('findById', () => {
    it('should return a task by id', async () => {
      const task = await Task.findById(1, mockTask.userId);
      expect(task).toHaveProperty('id', 1);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updatedTask = await Task.update(1, {
        title: '更新されたタスク',
        description: '更新された説明'
      }, mockTask.userId);
      expect(updatedTask).toHaveProperty('id', 1);
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
      const deletedTask = await Task.delete(1, mockTask.userId);
      expect(deletedTask).toHaveProperty('id', 1);
    });
  });

  describe('error handling', () => {
    it('should handle database errors', async () => {
      // データベースエラーをモック
      jest.spyOn(db, 'query').mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(Task.create(mockTask)).rejects.toThrow('Database error');
    });
  });
});