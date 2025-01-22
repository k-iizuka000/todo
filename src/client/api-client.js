import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 認証関連
export const auth = {
  signIn: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }
};

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

  update: async (id, subtaskData) => {
    const { data } = await api.put(`/subtasks/${id}`, subtaskData);
    return data;
  },

  delete: async (id) => {
    await api.delete(`/subtasks/${id}`);
  }
};

// インターセプターの設定
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});