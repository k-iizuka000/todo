const db = require('./db');

class User {
  static async findOrCreate({ email, googleId, name, avatarUrl }) {
    // 既存のユーザーを検索
    const findQuery = `
      SELECT * FROM users
      WHERE email = $1 OR google_id = $2
    `;
    const findResult = await db.query(findQuery, [email, googleId]);
    
    if (findResult.rows[0]) {
      // 既存のユーザーを更新
      const updateQuery = `
        UPDATE users
        SET name = COALESCE($1, name),
            avatar_url = COALESCE($2, avatar_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      const updateResult = await db.query(updateQuery, [name, avatarUrl, findResult.rows[0].id]);
      return updateResult.rows[0];
    }

    // 新規ユーザーを作成
    const createQuery = `
      INSERT INTO users (email, google_id, name, avatar_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const createResult = await db.query(createQuery, [email, googleId, name, avatarUrl]);
    return createResult.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT * FROM users
      WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = `
      SELECT * FROM users
      WHERE email = $1
    `;
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async update(id, { name, avatarUrl }) {
    const query = `
      UPDATE users
      SET name = COALESCE($1, name),
          avatar_url = COALESCE($2, avatar_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(query, [name, avatarUrl, id]);
    return result.rows[0];
  }
}

module.exports = User; 