function serviceTemplate(entity, projectId = 'PROJECT_ID') {
  const name = entity.name;
  const nameLower = name.toLowerCase();

  return `const { ${nameLower}Repo } = require('./${name}.repo');

const ${nameLower}Service = {
  read:   (userId, projectId)              => ${nameLower}Repo.findAll(userId, projectId),
  create: (data, userId, projectId)        => ${nameLower}Repo.insert(data, userId, projectId),
  update: (id, data, userId, projectId)    => ${nameLower}Repo.update(id, data, userId, projectId),
  remove: (id, userId, projectId)          => ${nameLower}Repo.remove(id, userId, projectId)
};

module.exports = { ${nameLower}Service };
`;
}

module.exports = serviceTemplate;
