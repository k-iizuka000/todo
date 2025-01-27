import pool from '../utils/db.js';

class Task {
  static async create({ title, description, userId, dueDate = null, parentId = null }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 親タスクが存在する場合、その存在確認を行う
      if (parentId !== null && parentId !== undefined) {
        console.log('Checking parent task:', parentId);  // デバッグログ追加
        const parentCheck = await client.query(
          'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
          [parentId, userId]
        );
        console.log('Parent check result:', parentCheck.rows);  // デバッグログ追加
        if (parentCheck.rows.length === 0) {
          throw new Error('親タスクが見つかりません');
        }
      }

      const query = `
        INSERT INTO tasks (title, description, user_id, due_date, parent_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const values = [title, description, userId, dueDate, parentId];
      console.log('Inserting task with values:', values);  // デバッグログ追加
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
            ARRAY[t.created_at] as path_order,
            t.id::text as path_id
          FROM tasks t
          WHERE t.user_id = $1 AND t.parent_id IS NULL
          
          UNION ALL
          
          -- サブタスクを再帰的に取得
          SELECT 
            t.*,
            tt.level + 1,
            tt.path_order || t.created_at,
            tt.path_id || '.' || t.id::text
          FROM tasks t
          JOIN task_tree tt ON t.parent_id = tt.id
          WHERE t.user_id = $1
        ),
        task_with_children AS (
          SELECT 
            t.id,
            t.title,
            t.description,
            t.status,
            t.priority,
            t.due_date,
            t.created_at,
            t.updated_at,
            t.user_id,
            t.parent_id,
            t.level,
            t.path_order,
            t.path_id,
            (
              SELECT json_agg(
                json_build_object(
                  'id', c.id,
                  'title', c.title,
                  'status', c.status,
                  'priority', c.priority,
                  'due_date', c.due_date,
                  'parent_id', c.parent_id,
                  'level', c.level
                )
              )
              FROM task_tree c
              WHERE c.parent_id = t.id
            ) as children
          FROM task_tree t
        )
        SELECT *
        FROM task_with_children
        ORDER BY path_id, level, created_at DESC;
      `;
      
      const result = await client.query(query, [userId]);
      return result.rows.map(row => ({
        ...row,
        children: row.children || []
      }));
    } finally {
      client.release();
    }
  }

  static async findById(id, userId) {
    const client = await pool.connect();
    try {
      const query = `
        WITH RECURSIVE task_hierarchy AS (
          -- ベースケース：指定されたタスクを取得
          SELECT 
            t.*,
            0 as level,
            ARRAY[t.created_at] as path_order
          FROM tasks t
          WHERE t.id = $1 AND t.user_id = $2

          UNION ALL

          -- 再帰ケース：子タスクを取得
          SELECT 
            t.*,
            h.level + 1,
            h.path_order || t.created_at
          FROM tasks t
          INNER JOIN task_hierarchy h ON t.parent_id = h.id
        )
        SELECT 
          t.*,
          COALESCE(json_agg(s.*) FILTER (WHERE s.id IS NOT NULL), '[]') as subtasks,
          COUNT(DISTINCT c.id) as child_count,
          COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') as completed_child_count
        FROM task_hierarchy t
        LEFT JOIN subtasks s ON t.id = s.task_id
        LEFT JOIN tasks c ON c.parent_id = t.id
        WHERE t.id = $1
        GROUP BY t.id, t.title, t.description, t.status, t.priority, 
                 t.due_date, t.created_at, t.updated_at, t.user_id, 
                 t.parent_id, t.level, t.path_order;
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