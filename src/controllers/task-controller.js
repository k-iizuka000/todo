import Task from '../models/task.js';
import { ApiError } from '../utils/api-error.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

export const createTask = async (req, res, next) => {
  try {
    console.log('Request headers:', req.headers); // デバッグログ
    console.log('Request body:', req.body); // デバッグログ

    // セッショントークンの取得
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('No token provided'); // デバッグログ
      return next(new ApiError(401, '認証トークンが必要です'));
    }

    console.log('Token received:', token.substring(0, 10) + '...'); // デバッグログ（セキュリティのため一部のみ表示）

    // 新しいSupabaseクライアントを作成（トークン付き）
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // ユーザー情報を取得
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth response:', { user: user?.id, error: authError }); // デバッグログ

    if (authError || !user) {
      console.error('Auth error:', authError); // デバッグログ
      return next(new ApiError(401, '無効な認証トークンです'));
    }

    const taskData = {
      ...req.body,
      user_id: user.id
    };

    console.log('Preparing to create task with data:', taskData); // デバッグログ

    // トークンを渡してタスクを作成
    const task = await Task.create(taskData, token);
    console.log('Task created successfully:', task); // デバッグログ
    
    res.status(201).json({
      status: 'success',
      data: task
    });
  } catch (error) {
    console.error('Create task error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    }); // 詳細なエラーログ
    next(new ApiError(500, error.message));
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new ApiError(401, '認証トークンが必要です'));
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return next(new ApiError(401, '無効な認証トークンです'));
    }

    const tasks = await Task.findAll(user.id, token);
    
    res.status(200).json({
      status: 'success',
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    next(new ApiError(500, error.message));
  }
};

export const getTask = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new ApiError(401, '認証トークンが必要です'));
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return next(new ApiError(401, '無効な認証トークンです'));
    }

    const task = await Task.findById(req.params.id, user.id, token);
    
    if (!task) {
      return next(new ApiError(404, 'タスクが見つかりません'));
    }
    
    res.status(200).json({
      status: 'success',
      data: task
    });
  } catch (error) {
    console.error('Get task by ID error:', error);
    next(new ApiError(500, error.message));
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new ApiError(401, '認証トークンが必要です'));
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return next(new ApiError(401, '無効な認証トークンです'));
    }

    const task = await Task.findById(req.params.id, user.id, token);
    
    if (!task) {
      return next(new ApiError(404, 'タスクが見つかりません'));
    }

    const updatedTask = await Task.update(req.params.id, user.id, req.body, token);
    
    res.status(200).json({
      status: 'success',
      data: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    next(new ApiError(500, error.message));
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new ApiError(401, '認証トークンが必要です'));
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return next(new ApiError(401, '無効な認証トークンです'));
    }
    
    // タスクの存在確認
    const { data, error: findError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', user.id);
    
    if (findError || !data || data.length === 0) {
      return next(new ApiError(404, 'タスクが見つかりません'));
    }

    await Task.delete(req.params.id, user.id, token);
    
    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Delete task error:', error);
    next(new ApiError(500, error.message));
  }
};

export const toggleTaskStatus = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id, req.user.id);
    
    if (!task) {
      return next(new ApiError(404, 'タスクが見つかりません'));
    }

    const updatedTask = await Task.update(req.params.id, req.user.id, {
      status: task.status === 'completed' ? 'pending' : 'completed'
    });
    
    res.status(200).json({
      status: 'success',
      data: updatedTask
    });
  } catch (error) {
    console.error('Toggle task status error:', error);
    next(new ApiError(500, error.message));
  }
};