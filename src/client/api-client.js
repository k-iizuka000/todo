import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// タスク関連
export const tasks = {
  getAll: async () => {
    const { data } = await api.get('/tasks');
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/tasks/${id}`);
    return data;
  },

  create: async (taskData) => {
    const { data } = await api.post('/tasks', taskData);
    return data;
  },

  update: async (id, taskData) => {
    const { data } = await api.put(`/tasks/${id}`, taskData);
    return data;
  },

  delete: async (id) => {
    await api.delete(`/tasks/${id}`);
  }
};

// サブタスク関連
export const subtasks = {
  getAll: async (taskId) => {
    const { data } = await api.get(`/tasks/${taskId}/subtasks`);
    return data;
  },

  create: async (taskId, subtaskData) => {
    const { data } = await api.post(`/tasks/${taskId}/subtasks`, subtaskData);
    return data;
  },

  update: async (taskId, id, subtaskData) => {
    const { data } = await api.put(`/tasks/${taskId}/subtasks/${id}`, subtaskData);
    return data;
  },

  delete: async (taskId, id) => {
    await api.delete(`/tasks/${taskId}/subtasks/${id}`);
  },

  toggleComplete: async (taskId, id) => {
    const { data } = await api.patch(`/tasks/${taskId}/subtasks/${id}/toggle`);
    return data;
  }
};