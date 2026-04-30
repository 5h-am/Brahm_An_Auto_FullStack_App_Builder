const { spawn } = require('child_process');
const crypto = require('crypto');
const path = require('path');
const request = require('supertest');
const { Pool } = require('pg');

const BASE_URL = 'http://127.0.0.1:3001';
const DATABASE_URL = 'postgresql://brahm:brahm_secret@localhost:5432/brahm_test';
const ACCESS_TOKEN_SECRET = 'test_access_secret_for_auth_suite';
const REFRESH_TOKEN_SECRET = 'test_refresh_secret_for_auth_suite';

let serverProcess;
let pool;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch(`${BASE_URL}/api/projects`);
      if (res.status) return;
    } catch (_err) {
      await wait(500);
    }
  }
  throw new Error('Backend server did not become reachable on port 3001');
}

function decodeJwtPayload(token) {
  const payload = token.split('.')[1];
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
}

function refreshCookieFrom(res) {
  const cookie = res.headers['set-cookie'].find(value => value.startsWith('refreshToken='));
  return cookie.split(';')[0];
}

beforeAll(async () => {
  pool = new Pool({ connectionString: DATABASE_URL });
  await pool.query('TRUNCATE refresh_tokens, app_data, projects, users RESTART IDENTITY CASCADE');

  serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      DATABASE_URL,
      ACCESS_TOKEN_SECRET,
      REFRESH_TOKEN_SECRET,
      PORT: '3001',
      NODE_ENV: 'test',
      FRONTEND_URL: 'http://localhost:5173',
      GITHUB_CREDENTIALS_ENCRYPTION_KEY: '12345678901234567890123456789012'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProcess.stdout.on('data', chunk => process.stdout.write(chunk));
  serverProcess.stderr.on('data', chunk => process.stderr.write(chunk));

  await waitForServer();
});

afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (pool) {
    await pool.end();
  }
});

describe('B1 auth registration', () => {
  test('registers a new user', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201);

    expect(res.body).toMatchObject({ success: true });
  });

  test('rejects duplicate email', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(409);

    expect(res.body).toEqual({ success: false, error: 'Email already registered' });
  });

  test.each([
    [{ email: 'notanemail', password: 'password123' }],
    [{ email: 'test2@example.com', password: 'short' }],
    [{ email: 'test3@example.com' }],
    [{}]
  ])('rejects invalid registration body %#', async body => {
    const res = await request(BASE_URL).post('/api/auth/register').send(body).expect(400);
    expect(res.body.success).toBe(false);
  });

  test('does not store plaintext password', async () => {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', ['test@example.com']);
    expect(rows[0].password_hash).not.toBe('password123');
    expect(rows[0].password_hash).not.toContain('password123');
  });
});

describe('B2 auth login token shape and cookie', () => {
  test('valid credentials return access token and HttpOnly refresh cookie', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);

    expect(res.body.accessToken).toEqual(expect.any(String));
    const setCookie = res.headers['set-cookie'].join('\n');
    expect(setCookie).toContain('refreshToken=');
    expect(setCookie).toMatch(/HttpOnly/i);

    const payload = decodeJwtPayload(res.body.accessToken);
    expect(payload.userId).toEqual(expect.any(String));
    expect(payload.email).toBe('test@example.com');
    expect(payload.exp - Math.floor(Date.now() / 1000)).toBeGreaterThanOrEqual(895);
    expect(payload.exp - Math.floor(Date.now() / 1000)).toBeLessThanOrEqual(905);
  });

  test('wrong password and non-existent email return the same error', async () => {
    const wrongPassword = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' })
      .expect(401);

    const missingEmail = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password: 'wrong' })
      .expect(401);

    expect(wrongPassword.body.error).toBe(missingEmail.body.error);
  });

  test('empty password is not a 500', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: '' });

    expect([400, 401]).toContain(res.status);
  });
});

describe('B3/B4 refresh rotation and logout', () => {
  test('refresh rotates token and revokes old token', async () => {
    const login = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);
    const oldCookie = refreshCookieFrom(login);

    const refreshed = await request(BASE_URL)
      .post('/api/auth/refresh')
      .set('Cookie', oldCookie)
      .expect(200);
    const newCookie = refreshCookieFrom(refreshed);

    expect(refreshed.body.accessToken).toEqual(expect.any(String));
    expect(newCookie).not.toBe(oldCookie);

    await request(BASE_URL).post('/api/auth/refresh').set('Cookie', oldCookie).expect(401);
    await request(BASE_URL).post('/api/auth/refresh').set('Cookie', newCookie).expect(200);
  });

  test('expired refresh token is rejected and missing cookie is rejected', async () => {
    const login = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);
    const cookie = refreshCookieFrom(login);
    const rawToken = cookie.replace('refreshToken=', '');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await pool.query("UPDATE refresh_tokens SET expires_at = NOW() - interval '1 second' WHERE token_hash = $1", [tokenHash]);

    await request(BASE_URL).post('/api/auth/refresh').set('Cookie', cookie).expect(401);
    await request(BASE_URL).post('/api/auth/refresh').expect(401);
  });

  test('logout revokes refresh token and clears cookie', async () => {
    const login = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);
    const cookie = refreshCookieFrom(login);
    const rawToken = cookie.replace('refreshToken=', '');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const logout = await request(BASE_URL)
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .expect(200);

    const { rows } = await pool.query('SELECT is_revoked FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    expect(rows[0].is_revoked).toBe(true);
    expect(logout.headers['set-cookie'].join('\n')).toMatch(/refreshToken=;/);

    await request(BASE_URL).post('/api/auth/refresh').set('Cookie', cookie).expect(401);
  });
});

describe('B11 security headers', () => {
  test('applies Helmet and credentialed CORS headers', async () => {
    const res = await request(BASE_URL)
      .get('/api/projects')
      .set('Origin', 'http://localhost:5173')
      .expect(401);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});
