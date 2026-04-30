const dataRepo = require('../repo/data.repo');

const dataService = {
  read:   (entity, query, userId, projectId)        => dataRepo.findAll(entity, query, userId, projectId),
  create: (entity, data, userId, projectId)          => dataRepo.insert(entity, data, userId, projectId),
  update: (entity, data, userId, projectId, id)      => dataRepo.update(entity, data, userId, projectId, id),
  delete: (entity, data, userId, projectId, id)      => dataRepo.remove(entity, userId, projectId, id),
  bulkInsert: (entity, items, userId, projectId)    => dataRepo.bulkInsert(entity, items, userId, projectId)
};

module.exports = dataService;
