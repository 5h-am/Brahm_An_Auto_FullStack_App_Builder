function handlerTemplate(entity, projectId = 'PROJECT_ID') {
  const name = entity.name;
  const nameLower = name.toLowerCase();

  return `const { ${nameLower}Service } = require('./${name}.service');

async function read(req, res, next) {
  try {
    const result = await ${nameLower}Service.read(req.user.userId, '\${projectId}');
    res.json({ success: true, data: result });
  } catch(err) { next(err); }
}

async function create(req, res, next) {
  try {
    const result = await ${nameLower}Service.create(req.body, req.user.userId, '\${projectId}');
    res.status(201).json({ success: true, data: result });
  } catch(err) { next(err); }
}

async function update(req, res, next) {
  try {
    const result = await ${nameLower}Service.update(req.params.id, req.body, req.user.userId, '\${projectId}');
    if (!result) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result });
  } catch(err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const result = await ${nameLower}Service.remove(req.params.id, req.user.userId, '\${projectId}');
    if (!result) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result });
  } catch(err) { next(err); }
}

module.exports = { read, create, update, remove };
`;
}

module.exports = handlerTemplate;
