require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const express = require('express');
const { applySecurityMiddleware } = require('./middlewares/security.middleware');
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const previewRoutes = require('./routes/preview.routes');
const githubRoutes = require('./routes/github.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const { runMigrations } = require('../../migrations/migrate');
const projectRepo = require('./repo/project.repo');
const { registerEntityRoutes } = require('./routes/data.routes');
const pool = require('./repo/db');

const app = express();

(async () => {
  try {
    applySecurityMiddleware(app);

    // A lightweight health check endpoint (with DB connectivity check)
    app.get('/api/health', async (req, res) => {
      try {
        await pool.query('SELECT 1');
        res.status(200).json({ 
          status: 'active', 
          database: 'connected',
          timestamp: new Date().toISOString() 
        });
      } catch (err) {
        res.status(503).json({ 
          status: 'degraded', 
          database: 'disconnected',
          error: err.message,
          timestamp: new Date().toISOString() 
        });
      }
    });

    app.use('/api/auth', authRoutes);

    app.use('/api/projects', projectRoutes);

    app.use('/preview', previewRoutes);
    app.use('/api/github', githubRoutes);

    await runMigrations();

    const projects = await projectRepo.findAll();
    for (const project of projects) {
      const config = project.config;
      if (config && Array.isArray(config.entities) && config.entities.length > 0) {
        registerEntityRoutes(app, config, project.id);
      }
    }

    app.use(errorMiddleware);

    app.listen(process.env.PORT || 3001, () => {
      console.log('Brahm backend running on port ' + (process.env.PORT || 3001));
    });
  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
})();
