const { z } = require('zod');
const authMiddleware = require('../middlewares/auth.middleware');
const dataService = require('../services/data.service');

const registeredRoutes = new Set();

function coerceIncomingPayload(entity, payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const coerced = {};
  for (const [key, type] of Object.entries(entity.fields)) {
    const raw = payload[key];
    if (raw === undefined) continue;
    if (type === 'number') {
      const n = Number(raw);
      coerced[key] = isNaN(n) ? raw : n;
    } else if (type === 'boolean') {
      if (raw === 'true' || raw === true) coerced[key] = true;
      else if (raw === 'false' || raw === false) coerced[key] = false;
      else coerced[key] = Boolean(raw);
    } else {
      coerced[key] = raw === null || raw === undefined ? '' : String(raw);
    }
  }
  return coerced;
}

function validatePayload(action, entity, payload) {
  if (action === 'read' || action === 'delete') return payload;
  const coerced = coerceIncomingPayload(entity, payload);
  const shape = {};
  for (const [key, type] of Object.entries(entity.fields)) {
    if (type === 'string')  shape[key] = z.string();
    if (type === 'number')  shape[key] = z.number();
    if (type === 'boolean') shape[key] = z.boolean();
  }
  const schema = z.object(shape).strict();
  const result = schema.safeParse(coerced);
  if (!result.success) {
    const fieldErrors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    const err = new Error('Validation failed: ' + fieldErrors);
    err.status = 400;
    throw err;
  }
  return result.data;
}

function handler(action, entity, projectId) {
  return async (req, res, next) => {
    try {
      const payload = action === 'read' ? req.query : req.body;
      const validated = validatePayload(action, entity, payload);
      const result = await dataService[action](entity.name, validated, req.user.userId, projectId, req.params.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}

function bulkHandler(entity, projectId) {
  return async (req, res, next) => {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        const err = new Error('Payload must be an array of objects');
        err.status = 400;
        throw err;
      }
      if (items.length > 500) {
        const err = new Error('Bulk import limit is 500 rows per request');
        err.status = 400;
        throw err;
      }
      const validatedItems = items.map(item => validatePayload('create', entity, item));
      const result = await dataService.bulkInsert(entity.name, validatedItems, req.user.userId, projectId);
      res.json({ success: true, count: result.length });
    } catch (err) {
      next(err);
    }
  };
}

function registerEntityRoutes(app, schema, projectId) {
  if (!Array.isArray(schema.entities)) return;
  schema.entities.forEach(entity => {
    const key = `${projectId}:${entity.name.toLowerCase()}`;
    if (registeredRoutes.has(key)) return;
    registeredRoutes.add(key);

    const e = entity.name.toLowerCase();
    const base = `/api/projects/${projectId}/data/${e}`;
    app.get(base, authMiddleware, handler('read', entity, projectId));
    app.post(base, authMiddleware, handler('create', entity, projectId));
    app.post(base + '/import', authMiddleware, bulkHandler(entity, projectId));
    app.put(base + '/:id', authMiddleware, handler('update', entity, projectId));
    app.delete(base + '/:id', authMiddleware, handler('delete', entity, projectId));
  });
}

module.exports = { registerEntityRoutes };
