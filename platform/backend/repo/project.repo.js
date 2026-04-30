const pool = require('./db');

async function findAllByUser(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

async function findAll() {
  const { rows } = await pool.query('SELECT * FROM projects');
  return rows;
}

async function findById(id, userId) {
  const { rows } = await pool.query(
    'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rows[0] || null;
}

async function insert(name, userId) {
  const { rows } = await pool.query(
    'INSERT INTO projects (user_id, name, config, version) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, name, JSON.stringify({}), 1]
  );
  return rows[0];
}

async function updateConfig(id, userId, config) {
  const { rows } = await pool.query(
    'UPDATE projects SET config = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [JSON.stringify(config), id, userId]
  );
  return rows[0] || null;
}

async function remove(id, userId) {
  const { rows } = await pool.query(
    'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  return rows[0] || null;
}

module.exports = { findAllByUser, findAll, findById, insert, updateConfig, remove };
