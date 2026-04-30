const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const authRepo = require('../repo/auth.repo');

const SALT_ROUNDS = 12;

async function register(email, password) {
  const existing = await authRepo.findByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await authRepo.createUser(email, passwordHash);
  return user;
}

async function login(email, password) {
  const user = await authRepo.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

  const rawRefreshToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await authRepo.storeRefreshToken(tokenHash, user.id, expiresAt);

  return { accessToken, rawRefreshToken };
}

async function refresh(rawRefreshToken) {
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const storedToken = await authRepo.findRefreshToken(tokenHash);

  if (!storedToken) {
    const err = new Error('Invalid refresh token');
    err.status = 401;
    throw err;
  }

  if (storedToken.is_revoked || new Date(storedToken.expires_at) < new Date()) {
    const err = new Error('Invalid refresh token');
    err.status = 401;
    throw err;
  }

  await authRepo.revokeRefreshToken(tokenHash);

  const user = await authRepo.findById(storedToken.user_id);

  const accessToken = jwt.sign(
    { userId: storedToken.user_id, email: user ? user.email : '' },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

  const newRawRefreshToken = crypto.randomBytes(64).toString('hex');
  const newTokenHash = crypto.createHash('sha256').update(newRawRefreshToken).digest('hex');
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await authRepo.storeRefreshToken(newTokenHash, storedToken.user_id, newExpiresAt);

  return { accessToken, rawRefreshToken: newRawRefreshToken };
}

async function logout(rawRefreshToken) {
  if (!rawRefreshToken) return;
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  await authRepo.revokeRefreshToken(tokenHash);
}

module.exports = { register, login, refresh, logout };
