import pool from '../utils/db.js';

class Task {
  static async create({ title, description, userId, dueDate = null }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const query = `
        INSERT INTO tasks (title, description, user_id, due_date)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const values = [title, description, userId, dueDate];
      const result = await client.query(query, values);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('タスク作成エラー:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async findAll(userId) {
    const client = await pool.connect();
    try {
      const query = `
        WITH RECURSIVE task_tree AS (
          -- 親タスク（parent_idがNULLのタスク）を取得
          SELECT 
            t.*,
            0 as level,
            ARRAY[t.created_at] as path_order
          FROM tasks t
          WHERE t.user_id = $1 AND t.parent_id IS NULL
          
          UNION ALL
          
          -- サブタスクを再帰的に取得
          SELECT 
            t.*,
            tt.level + 1,
            tt.path_order || t.created_at
          FROM tasks t
          JOIN task_tree tt ON t.parent_id = tt.id
          WHERE t.user_id = $1
        )
        SELECT 
          tt.*,
          COUNT(s.id) as subtask_count,
          COUNT(CASE WHEN s.is_completed THEN 1 END) as completed_subtask_count
        FROM task_tree tt
        LEFT JOIN subtasks s ON tt.id = s.task_id
        GROUP BY tt.id, tt.title, tt.description, tt.status, tt.priority, 
                 tt.due_date, tt.created_at, tt.updated_at, tt.user_id, 
                 tt.parent_id, tt.level, tt.path_order
        ORDER BY tt.path_order, tt.level, tt.created_at DESC
      `;
      const result = await client.query(query, [userId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  static async findById(id, userId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT t.*, 
               json_agg(s.*) as subtasks
        FROM tasks t
        LEFT JOIN subtasks s ON t.id = s.task_id
        WHERE t.id = $1 AND t.user_id = $2
        GROUP BY t.id
      `;
      const result = await client.query(query, [id, userId]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async update(id, userId, updates) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 3}`)
        .join(', ');
      
      const query = `
        UPDATE tasks
        SET ${setClause}
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const values = [id, userId, ...Object.values(updates)];
      const result = await client.query(query, values);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const query = `
        DELETE FROM tasks
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      const result = await client.query(query, [id, userId]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default Task; 