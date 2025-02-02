import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

class Task {
  static getSupabaseClient(token = null) {
    const options = token ? {
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
    } : undefined;

    return createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      options
    );
  }

  static async create({ title, description, user_id, due_date = null, parent_id = null }, token) {
    try {
      console.log('Task.create called with:', {
        title,
        description,
        user_id,
        due_date,
        parent_id,
        hasToken: !!token
      });

      const supabase = this.getSupabaseClient(token);
      console.log('Supabase client created');

      // 親タスクの存在確認
      if (parent_id) {
        console.log('Checking parent task:', parent_id);
        const { data: parentTask, error: parentError } = await supabase
          .from('tasks')
          .select('id')
          .eq('id', parent_id)
          .eq('user_id', user_id)
          .single();

        console.log('Parent task check result:', { parentTask, parentError });

        if (parentError || !parentTask) {
          throw new Error('親タスクが見つかりません');
        }
      }

      console.log('Preparing to insert task');

      // タスクの作成
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ 
          title,
          description,
          user_id,
          due_date,
          parent_id,
          status: 'pending'
        }])
        .select()
        .single();

      console.log('Insert result:', { data, error });

      if (error) {
        console.error('Insert error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Task creation error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      throw error;
    }
  }

  static async findAll(userId, token) {
    try {
      const supabase = this.getSupabaseClient(token);

      // Retrieve all tasks for the user
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Select error:', error);
        throw error;
      }

      // Build a map of tasks by id and initialize children array
      const tasksById = {};
      data.forEach(task => {
        tasksById[task.id] = { ...task, children: [] };
      });

      // Group tasks: attach tasks with a parent_id to their parent's children array
      const parentTasks = [];
      data.forEach(task => {
        if (task.parent_id) {
          if (tasksById[task.parent_id]) {
            tasksById[task.parent_id].children.push(tasksById[task.id]);
          }
        } else {
          parentTasks.push(tasksById[task.id]);
        }
      });

      return parentTasks;
    } catch (error) {
      console.error('タスク取得エラー:', error);
      throw error;
    }
  }

  static async findById(id, userId, token) {
    try {
      const supabase = this.getSupabaseClient(token);

      // Fetch the parent task
      const { data: parentTask, error: parentError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (parentError) {
        console.error('Parent task error:', parentError);
        throw parentError;
      }

      // Fetch child tasks for the parent task
      const { data: children, error: childrenError } = await supabase
        .from('tasks')
        .select('*')
        .eq('parent_id', id)
        .eq('user_id', userId);

      if (childrenError) {
        console.error('Children tasks error:', childrenError);
        throw childrenError;
      }

      return {
        ...parentTask,
        children: children || []
      };
    } catch (error) {
      console.error('タスク取得エラー:', error);
      throw error;
    }
  }

  static async update(id, userId, updates, token) {
    try {
      const supabase = this.getSupabaseClient(token);

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error); // デバッグログ追加
        throw error;
      }
      return data;
    } catch (error) {
      console.error('タスク更新エラー:', error);
      throw error;
    }
  }

  static async delete(id, userId, token) {
    try {
      const supabase = this.getSupabaseClient(token);

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('Delete error:', error); // デバッグログ追加
        throw error;
      }
      return true;
    } catch (error) {
      console.error('タスク削除エラー:', error);
      throw error;
    }
  }
}

export default Task; 