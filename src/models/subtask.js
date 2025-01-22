const db = require('./db');

class Subtask {
  static async create({ taskId, content }) {
    const query = `
      INSERT INTO subtasks (task_id, content)
      VALUES ($1, $2)
      RETURNING *
    `;
    const values = [taskId, content];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findByTaskId(taskId) {
    const query = `
      SELECT *
      FROM subtasks
      WHERE task_id = $1
      ORDER BY created_at ASC
    `;
    const result = await db.query(query, [taskId]);
    return result.rows;
  }

  static async update(id, { content, isCompleted }) {
    const query = `
      UPDATE subtasks
      SET content = COALESCE($1, content),
          is_completed = COALESCE($2, is_completed),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const values = [content, isCompleted, id];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = `
      DELETE FROM subtasks
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async toggleComplete(id) {
    const query = `
      UPDATE subtasks
      SET is_completed = NOT is_completed,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Subtask; 