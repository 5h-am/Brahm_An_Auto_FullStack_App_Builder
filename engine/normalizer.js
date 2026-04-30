const { nanoid } = require('nanoid');
const { DEFAULT_TOKENS } = require('./constants');

const SHORTHANDS = {
  t: 'text',
  bg: 'background',
  p: 'padding',
  col: 'column',
  w: 'width',
  h: 'height',
  m: 'margin',
  btn: 'button',
  lbl: 'label'
};

function normalize(parsed) {
  const engineWarnings = [];
  const config = JSON.parse(JSON.stringify(parsed));

  const topLevelKeys = Object.keys(config);
  for (const key of topLevelKeys) {
    if (SHORTHANDS[key]) {
      config[SHORTHANDS[key]] = config[key];
      delete config[key];
    } else if (key.length <= 3 && !SHORTHANDS[key]) {
      engineWarnings.push(`Unknown shorthand key '${key}' was left unchanged.`);
    }
  }

  if (!Array.isArray(config.layout)) {
    config.layout = [];
  }

  config.layout = config.layout.map(item => {
    const out = Object.assign({}, item);
    if (!out.id) {
      out.id = nanoid();
    }
    if (!out.props) {
      out.props = {};
    }
    if (out.type === 'form') {
      if (!out.props.submitText) out.props.submitText = 'Submit';
      if (!out.props.fields) out.props.fields = [];
    }
    if (out.type === 'table') {
      if (out.props.pageSize === undefined) out.props.pageSize = 10;
      if (out.props.sortable === undefined) out.props.sortable = true;
      if (!out.props.columns) out.props.columns = [];
    }
    if (out.type === 'button') {
      if (!out.props.label) out.props.label = 'Click';
    }
    return out;
  });

  if (!config.theme) {
    config.theme = { tokens: DEFAULT_TOKENS };
  } else if (!config.theme.tokens) {
    config.theme.tokens = DEFAULT_TOKENS;
  }

  if (config.i18n) {
    if (!Array.isArray(config.i18n.locales)) config.i18n.locales = ['en'];
    if (typeof config.i18n.default !== 'string') config.i18n.default = 'en';
    if (!config.i18n.translations || typeof config.i18n.translations !== 'object') {
      config.i18n.translations = {};
    }
    if (!config.i18n.translations[config.i18n.default]) {
      config.i18n.translations[config.i18n.default] = {};
    }
  }

  if (!Array.isArray(config.entities)) {
    config.entities = [];
  }

  return { config, engineWarnings };
}

module.exports = { normalize };
