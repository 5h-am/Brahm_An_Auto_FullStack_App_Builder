const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

function applySecurityMiddleware(app) {
  app.use(helmet());

  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(morgan('dev'));

  app.use(express.json({ limit: '1mb' }));

  app.use(cookieParser());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api', limiter);
}

module.exports = { applySecurityMiddleware };
