const pool = require('./db');

async function findAll(entity, query, userId, projectId) {
  const { rows } = await pool.query(
    'SELECT * FROM app_data WHERE project_id = $1 AND user_id = $2 AND collection_name = $3',
    [projectId, userId, entity]
  );
  return rows;
}

async function insert(entity, data, userId, projectId) {
  const { rows } = await pool.query(
    'INSERT INTO app_data (project_id, user_id, collection_name, data) VALUES ($1, $2, $3, $4) RETURNING *',
    [projectId, userId, entity, JSON.stringify(data)]
  );
  return rows[0];
}

async function update(entity, data, userId, projectId, id) {
  const { rows } = await pool.query(
    'UPDATE app_data SET data = $1 WHERE id = $2 AND project_id = $3 AND user_id = $4 RETURNING *',
    [JSON.stringify(data), id, projectId, userId]
  );
  return rows[0] || null;
}

async function remove(entity, userId, projectId, id) {
  const { rows } = await pool.query(
    'DELETE FROM app_data WHERE id = $1 AND project_id = $2 AND user_id = $3 RETURNING id',
    [id, projectId, userId]
  );
  return rows[0] || null;
}

async function bulkInsert(entity, items, userId, projectId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results = [];
    for (const item of items) {
      const { rows } = await client.query(
        'INSERT INTO app_data (project_id, user_id, collection_name, data) VALUES ($1, $2, $3, $4) RETURNING *',
        [projectId, userId, entity, JSON.stringify(item)]
      );
      results.push(rows[0]);
    }
    await client.query('COMMIT');
    return results;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { findAll, insert, update, remove, bulkInsert };
