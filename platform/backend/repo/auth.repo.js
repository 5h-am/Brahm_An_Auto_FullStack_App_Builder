const pool = require('./db');

async function findByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

async function createUser(email, passwordHash) {
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, passwordHash]
  );
  return rows[0];
}

async function storeRefreshToken(tokenHash, userId, expiresAt) {
  await pool.query(
    'INSERT INTO refresh_tokens (token_hash, user_id, expires_at, is_revoked) VALUES ($1, $2, $3, $4)',
    [tokenHash, userId, expiresAt, false]
  );
}

async function findRefreshToken(tokenHash) {
  const { rows } = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1',
    [tokenHash]
  );
  return rows[0] || null;
}

async function revokeRefreshToken(tokenHash) {
  await pool.query(
    'UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1',
    [tokenHash]
  );
}

async function findById(userId) {
  const { rows } = await pool.query(
    'SELECT id, email, created_at FROM users WHERE id = $1',
    [userId]
  );
  return rows[0] || null;
}

module.exports = { findByEmail, findById, createUser, storeRefreshToken, findRefreshToken, revokeRefreshToken };
