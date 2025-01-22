const db = require('./db');

class Task {
  static async create({ title, description, userId }) {
    const query = `
      INSERT INTO tasks (title, description, user_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [title, description, userId];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findAll(userId) {
    const query = `
      SELECT t.*, 
             COUNT(s.id) as subtask_count,
             COUNT(CASE WHEN s.is_completed THEN 1 END) as completed_subtask_count
      FROM tasks t
      LEFT JOIN subtasks s ON t.id = s.task_id
      WHERE t.user_id = $1
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async findById(id, userId) {
    const query = `
      SELECT t.*, 
             json_agg(s.*) as subtasks
      FROM tasks t
      LEFT JOIN subtasks s ON t.id = s.task_id
      WHERE t.id = $1 AND t.user_id = $2
      GROUP BY t.id
    `;
    const result = await db.query(query, [id, userId]);
    return result.rows[0];
  }

  static async update(id, { title, description, status }, userId) {
    const query = `
      UPDATE tasks
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          status = COALESCE($3, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `;
    const values = [title, description, status, id, userId];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id, userId) {
    const query = `
      DELETE FROM tasks
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [id, userId]);
    return result.rows[0];
  }
}

module.exports = Task; 