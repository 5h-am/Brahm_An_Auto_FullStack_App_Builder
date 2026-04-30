const { z } = require('zod');
const authService = require('../services/auth.service');

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

async function register(req, res, next) {
  try {
    const result = RegisterSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error.errors[0].message });
    }

    await authService.register(result.data.email, result.data.password);
    res.status(201).json({ success: true, message: 'Account created' });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = LoginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error.errors[0].message });
    }

    const { accessToken, rawRefreshToken } = await authService.login(result.data.email, result.data.password);

    res.cookie('refreshToken', rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, accessToken });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const rawRefreshToken = req.cookies.refreshToken;
    if (!rawRefreshToken) {
      return res.status(401).json({ success: false, error: 'No refresh token' });
    }

    const { accessToken, rawRefreshToken: newRawRefreshToken } = await authService.refresh(rawRefreshToken);

    res.cookie('refreshToken', newRawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const rawRefreshToken = req.cookies.refreshToken;
    await authService.logout(rawRefreshToken);
    res.clearCookie('refreshToken');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout };
