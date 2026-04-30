const projectRepo = require('../repo/project.repo');

async function getAll(userId) { return projectRepo.findAllByUser(userId); }
async function getById(id, userId) { return projectRepo.findById(id, userId); }
async function create(name, userId) { return projectRepo.insert(name, userId); }
async function update(id, userId, config) { return projectRepo.updateConfig(id, userId, config); }
async function destroy(id, userId) { return projectRepo.remove(id, userId); }

module.exports = { getAll, getById, create, update, destroy };
