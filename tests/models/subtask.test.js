const Subtask = require('../../src/models/subtask');
const db = require('../../src/models/db');

// モックデータ
const mockSubtask = {
  taskId: 1,
  content: 'テストサブタスク',
  isCompleted: false
};

describe('Subtask Model', () => {
  beforeEach(() => {
    // データベースのクエリ結果をモック
    jest.spyOn(db, 'query').mockImplementation(() => ({
      rows: [{ id: 1, ...mockSubtask }]
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('should create a new subtask', async () => {
      const subtask = await Subtask.create(mockSubtask);
      expect(subtask).toHaveProperty('id', 1);
      expect(subtask.content).toBe(mockSubtask.content);
      expect(subtask.taskId).toBe(mockSubtask.taskId);
    });
  });

  describe('findByTaskId', () => {
    it('should return all subtasks for a task', async () => {
      const subtasks = await Subtask.findByTaskId(mockSubtask.taskId);
      expect(Array.isArray(subtasks)).toBe(true);
      expect(subtasks[0]).toHaveProperty('id');
    });
  });

  describe('update', () => {
    it('should update a subtask', async () => {
      const updatedSubtask = await Subtask.update(1, {
        content: '更新されたサブタスク',
        isCompleted: true
      });
      expect(updatedSubtask).toHaveProperty('id', 1);
    });
  });

  describe('delete', () => {
    it('should delete a subtask', async () => {
      const deletedSubtask = await Subtask.delete(1);
      expect(deletedSubtask).toHaveProperty('id', 1);
    });
  });

  describe('toggleComplete', () => {
    it('should toggle the completion status of a subtask', async () => {
      const toggledSubtask = await Subtask.toggleComplete(1);
      expect(toggledSubtask).toHaveProperty('id', 1);
    });
  });

  describe('error handling', () => {
    it('should handle database errors', async () => {
      // データベースエラーをモック
      jest.spyOn(db, 'query').mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(Subtask.create(mockSubtask)).rejects.toThrow('Database error');
    });
  });
});