const { normalize } = require('./normalizer');
const { validate } = require('./validator');
const { generateTemplates } = require('./templates/index');

module.exports = { normalize, validate, generateTemplates };
