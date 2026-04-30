const componentTemplate = require('./component.template');
const handlerTemplate = require('./handler.template');
const serviceTemplate = require('./service.template');
const repoTemplate = require('./repo.template');

function generateTemplates(normalizedConfig, projectId = 'PROJECT_ID') {
  if (!normalizedConfig || !Array.isArray(normalizedConfig.entities)) {
    return { frontend: {}, backend: {} };
  }

  const frontend = {};
  const backend = {};

  normalizedConfig.entities.forEach(entity => {
    const name = entity.name;
    frontend[name + 'View.jsx'] = componentTemplate(entity, normalizedConfig.version || 1, projectId);
    backend[name + '.handler.js'] = handlerTemplate(entity, projectId);
    backend[name + '.service.js'] = serviceTemplate(entity, projectId);
    backend[name + '.repo.js'] = repoTemplate(entity, projectId);
  });

  return { frontend, backend };
}

module.exports = { generateTemplates };
