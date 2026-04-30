const projectService = require('../services/project.service');
const { registerEntityRoutes } = require('../routes/data.routes');

async function list(req, res, next) {
  try {
    const projects = await projectService.getAll(req.user.userId);
    res.json({ success: true, data: projects });
  } catch(err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const project = await projectService.getById(req.params.projectId, req.user.userId);
    if (!project) { return res.status(404).json({ success: false, error: 'Not found' }); }
    res.json({ success: true, data: project });
  } catch(err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: 'name is required' });
    }
    const project = await projectService.create(name, req.user.userId);
    res.status(201).json({ success: true, data: project });
  } catch(err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { config } = req.body;
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ success: false, error: 'config object is required' });
    }
    const project = await projectService.update(req.params.projectId, req.user.userId, config);
    if (!project) { return res.status(404).json({ success: false, error: 'Not found' }); }

    const app = req.app;
    if (Array.isArray(config.entities) && config.entities.length > 0) {
      registerEntityRoutes(app, config, req.params.projectId);
    }

    res.json({ success: true, data: project });
  } catch(err) { next(err); }
}

async function destroy(req, res, next) {
  try {
    const deleted = await projectService.destroy(req.params.projectId, req.user.userId);
    if (!deleted) { return res.status(404).json({ success: false, error: 'Not found' }); }
    res.json({ success: true, data: { id: deleted.id } });
  } catch(err) { next(err); }
}

module.exports = { list, getOne, create, update, destroy };
