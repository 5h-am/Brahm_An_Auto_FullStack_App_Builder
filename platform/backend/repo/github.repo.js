const pool = require('./db');
const { encrypt, decrypt } = require('../utils/encrypt');

async function findByUserId(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM github_credentials WHERE user_id = $1',
    [userId]
  );
  if (!rows[0]) return null;
  return {
    userId: rows[0].user_id,
    githubUsername: rows[0].github_username,
    token: decrypt(rows[0].encrypted_token),
    createdAt: rows[0].created_at,
    updatedAt: rows[0].updated_at
  };
}

async function upsert(userId, plainToken, githubUsername) {
  const encryptedToken = encrypt(plainToken);
  const { rows } = await pool.query(
    `INSERT INTO github_credentials (user_id, encrypted_token, github_username)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE
       SET encrypted_token = EXCLUDED.encrypted_token,
           github_username  = EXCLUDED.github_username,
           updated_at       = NOW()
     RETURNING *`,
    [userId, encryptedToken, githubUsername]
  );
  return rows[0];
}

async function remove(userId) {
  const { rows } = await pool.query(
    'DELETE FROM github_credentials WHERE user_id = $1 RETURNING user_id',
    [userId]
  );
  return rows[0] || null;
}

module.exports = { findByUserId, upsert, remove };
