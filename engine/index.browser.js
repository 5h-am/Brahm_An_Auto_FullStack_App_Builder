import { z } from 'zod';
import { nanoid } from 'nanoid';

const DEFAULT_TOKENS = {
  primary: '#1a3a5c',
  background: '#ffffff',
  surface: '#f9f9f9',
  divider: '#e5e5e5',
  textPrimary: '#0a0a0a',
  textSecondary: '#6b6b6b',
  success: '#1D9E75',
  warning: '#D97706',
  error: '#E24B4A',
  radius: '4px',
  spacing: '8px'
};

const SHORTHANDS = {
  t: 'text', bg: 'background', p: 'padding', col: 'column',
  w: 'width', h: 'height', m: 'margin', btn: 'button', lbl: 'label'
};

export function normalize(raw) {
  const engineWarnings = [];
  const config = JSON.parse(JSON.stringify(raw));

  function expandKeys(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(expandKeys);
    const result = {};
    for (const key of Object.keys(obj)) {
      const expanded = SHORTHANDS[key];
      if (expanded) {
        result[expanded] = expandKeys(obj[key]);
      } else if (key.length <= 3 && !SHORTHANDS[key]) {
        engineWarnings.push("Unknown shorthand key '" + key + "' was left unchanged.");
        result[key] = expandKeys(obj[key]);
      } else {
        result[key] = expandKeys(obj[key]);
      }
    }
    return result;
  }

  const expanded = expandKeys(config);

  if (!expanded.theme) {
    expanded.theme = { tokens: { ...DEFAULT_TOKENS } };
  } else if (!expanded.theme.tokens) {
    expanded.theme.tokens = { ...DEFAULT_TOKENS };
  }

  if (expanded.i18n) {
    if (!Array.isArray(expanded.i18n.locales)) expanded.i18n.locales = ['en'];
    if (typeof expanded.i18n.default !== 'string') expanded.i18n.default = 'en';
    if (!expanded.i18n.translations || typeof expanded.i18n.translations !== 'object') {
      expanded.i18n.translations = {};
    }
    if (!expanded.i18n.translations[expanded.i18n.default]) {
      expanded.i18n.translations[expanded.i18n.default] = {};
    }
  }

  if (Array.isArray(expanded.layout)) {
    expanded.layout = expanded.layout.map(item => {
      if (!item.id) item.id = nanoid();
      if (!item.props) item.props = {};
      if (item.type === 'form') {
        if (!item.props.submitText) item.props.submitText = 'Submit';
        if (!item.props.fields) item.props.fields = [];
      }
      if (item.type === 'table') {
        if (item.props.pageSize == null) item.props.pageSize = 10;
        if (item.props.sortable == null) item.props.sortable = true;
        if (!item.props.columns) item.props.columns = [];
      }
      if (item.type === 'button') {
        if (!item.props.label) item.props.label = 'Click';
      }
      return item;
    });
  }

  return { config: expanded, engineWarnings };
}

const FormPropsSchema = z.object({
  fields: z.array(z.string()).default([]),
  submitText: z.string().default('Submit')
});

const TablePropsSchema = z.object({
  columns: z.array(z.string()).default([]),
  pageSize: z.number().default(10),
  sortable: z.boolean().default(true),
  selectable: z.boolean().default(false)
});

const HeaderPropsSchema = z.object({
  title: z.string().default('Header')
});

const CardPropsSchema = z.object({
  title: z.string().default('Card Title'),
  body: z.string().default('')
});

const ButtonPropsSchema = z.object({
  label: z.string().default('Click')
});

const InputPropsSchema = z.object({
  placeholder: z.string().default(''),
  name: z.string().default('field')
});

const TextPropsSchema = z.object({
  content: z.string().default('')
});

const GenericPropsSchema = z.record(z.unknown());

const STARTER_SCHEMAS = {
  form: FormPropsSchema,
  table: TablePropsSchema,
  header: HeaderPropsSchema,
  card: CardPropsSchema,
  button: ButtonPropsSchema,
  input: InputPropsSchema,
  text: TextPropsSchema
};

function validateProps(type, props) {
  const schema = STARTER_SCHEMAS[type];
  if (schema) return schema.safeParse(props || {});
  return GenericPropsSchema.safeParse(props || {});
}

function getLineColumn(rawJsonString, key) {
  const search = '"' + key + '"';
  const idx = rawJsonString.indexOf(search);
  if (idx === -1) return { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 };
  const before = rawJsonString.substring(0, idx);
  const lines = before.split('\n');
  const startLineNumber = lines.length;
  const startColumn = lines[lines.length - 1].length + 1;
  return { startLineNumber, startColumn, endLineNumber: startLineNumber, endColumn: startColumn + search.length };
}

const LayoutItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  props: z.unknown().optional(),
  actions: z.record(z.string()).optional()
});

const EntitySchema = z.object({
  name: z.string(),
  fields: z.record(z.string())
});

const ThemeSchema = z.object({
  tokens: z.record(z.string()).optional()
}).optional();

const I18nSchema = z.object({
  locales: z.array(z.string()).default(['en']),
  default: z.string().default('en'),
  translations: z.record(z.record(z.string())).default({})
}).optional();

const BrahmSchema = z.object({
  version: z.number().default(1),
  theme: ThemeSchema,
  i18n: I18nSchema,
  layout: z.array(LayoutItemSchema),
  entities: z.array(EntitySchema)
});

export function validate(normalizedConfig, rawJsonString) {
  const topResult = BrahmSchema.safeParse(normalizedConfig);
  const errors = [];
  const monacoMarkers = [];

  if (!topResult.success) {
    for (const issue of topResult.error.issues) {
      errors.push({ message: issue.message, path: issue.path });
      const key = issue.path[issue.path.length - 1];
      if (key != null) {
        const pos = getLineColumn(rawJsonString || '', String(key));
        monacoMarkers.push({ ...pos, message: issue.message, severity: 8 });
      }
    }
    return { success: false, data: null, errors, monacoMarkers };
  }

  const data = topResult.data;

  if (Array.isArray(data.layout)) {
    for (const item of data.layout) {
      const propsResult = validateProps(item.type, item.props);
      if (!propsResult.success) {
        for (const issue of propsResult.error.issues) {
          errors.push({ message: item.type + ' props: ' + issue.message, path: issue.path });
          const key = issue.path[issue.path.length - 1];
          if (key != null) {
            const pos = getLineColumn(rawJsonString || '', String(key));
            monacoMarkers.push({ ...pos, message: issue.message, severity: 8 });
          }
        }
      } else {
        item.props = propsResult.data;
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, data: null, errors, monacoMarkers };
  }

  return { success: true, data, errors: [], monacoMarkers: [] };
}

function componentTemplate(entity, version, projectId) {
  const name = entity.name;
  const fields = Object.entries(entity.fields || {});
  const initialForm = fields.map(([k, t]) => {
    if (t === 'number') return `    ${k}: 0`;
    if (t === 'boolean') return `    ${k}: false`;
    return `    ${k}: ''`;
  }).join(',\n');
  const tableHeaders = fields.map(([k]) => `<th>${k}</th>`).join('');
  const tableCells = fields.map(([k]) => `<td>{String(r.data?.${k} ?? '')}</td>`).join('');
  const inputs = fields.map(([k, t]) => {
    if (t === 'boolean') return `      <label>${k}: <input type="checkbox" checked={form.${k}} onChange={e => setForm(prev => ({ ...prev, ${k}: e.target.checked }))} /></label>`;
    if (t === 'number') return `      <input type="number" value={form.${k}} onChange={e => setForm(prev => ({ ...prev, ${k}: Number(e.target.value) }))} placeholder="${k}" />`;
    return `      <input value={form.${k}} onChange={e => setForm(prev => ({ ...prev, ${k}: e.target.value }))} placeholder="${k}" />`;
  }).join('\n');

  return `import { useState, useEffect } from 'react';

export default function ${name}View() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
${initialForm}
  });

  useEffect(() => {
    fetch('/api/projects/${projectId}/data/${name.toLowerCase()}', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('brahm_access_token') }
    }).then(r => r.json()).then(d => setRows(d.data || []));
  }, []);

  function handleSubmit() {
    fetch('/api/projects/${projectId}/data/${name.toLowerCase()}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('brahm_access_token') },
      body: JSON.stringify(form)
    }).then(r => r.json()).then(d => setRows(prev => [...prev, d.data]));
  }

  return (
    <div>
      <table>
        <thead><tr>${tableHeaders}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>${tableCells}</tr>)}</tbody>
      </table>
${inputs}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}`;
}

function handlerTemplate(entity, projectId) {
  const name = entity.name;
  const lower = name.toLowerCase();
  return `const { ${lower}Service } = require('./${name}.service');

async function read(req, res, next) {
  try {
    const result = await ${lower}Service.read(req.user.userId, '${projectId}');
    res.json({ success: true, data: result });
  } catch(err) { next(err); }
}

async function create(req, res, next) {
  try {
    const result = await ${lower}Service.create(req.body, req.user.userId, '${projectId}');
    res.status(201).json({ success: true, data: result });
  } catch(err) { next(err); }
}

async function update(req, res, next) {
  try {
    const result = await ${lower}Service.update(req.params.id, req.body, req.user.userId, '${projectId}');
    if (!result) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result });
  } catch(err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const result = await ${lower}Service.remove(req.params.id, req.user.userId, '${projectId}');
    if (!result) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result });
  } catch(err) { next(err); }
}

module.exports = { read, create, update, remove };`;
}

function serviceTemplate(entity) {
  const name = entity.name;
  const lower = name.toLowerCase();
  return `const { ${lower}Repo } = require('./${name}.repo');

const ${lower}Service = {
  read:   (userId, projectId)           => ${lower}Repo.findAll(userId, projectId),
  create: (data, userId, projectId)     => ${lower}Repo.insert(data, userId, projectId),
  update: (id, data, userId, projectId) => ${lower}Repo.update(id, data, userId, projectId),
  remove: (id, userId, projectId)       => ${lower}Repo.remove(id, userId, projectId)
};

module.exports = { ${lower}Service };`;
}

function repoTemplate(entity) {
  const name = entity.name;
  const lower = name.toLowerCase();
  return `const pool = require('./db');

const ${lower}Repo = {
  findAll: async (userId, projectId) => {
    const { rows } = await pool.query(
      'SELECT * FROM app_data WHERE project_id = $1 AND user_id = $2 AND collection_name = $3',
      [projectId, userId, '${lower}']
    );
    return rows;
  },
  insert: async (data, userId, projectId) => {
    const { rows } = await pool.query(
      'INSERT INTO app_data (project_id, user_id, collection_name, data) VALUES ($1, $2, $3, $4) RETURNING *',
      [projectId, userId, '${lower}', JSON.stringify(data)]
    );
    return rows[0];
  },
  update: async (id, data, userId, projectId) => {
    const { rows } = await pool.query(
      'UPDATE app_data SET data = $1 WHERE id = $2 AND project_id = $3 AND user_id = $4 RETURNING *',
      [JSON.stringify(data), id, projectId, userId]
    );
    return rows[0] || null;
  },
  remove: async (id, userId, projectId) => {
    const { rows } = await pool.query(
      'DELETE FROM app_data WHERE id = $1 AND project_id = $2 AND user_id = $3 RETURNING id',
      [id, projectId, userId]
    );
    return rows[0] || null;
  }
};

module.exports = { ${lower}Repo };`;
}

export function generateTemplates(normalizedConfig, projectId) {
  if (!normalizedConfig || !Array.isArray(normalizedConfig.entities)) {
    return { frontend: {}, backend: {} };
  }

  const frontend = {};
  const backend = {};
  const pid = projectId || 'PROJECT_ID';

  normalizedConfig.entities.forEach(entity => {
    const name = entity.name;
    const version = normalizedConfig.version || 1;
    frontend[name + 'View.jsx'] = componentTemplate(entity, version, pid);
    backend[name + '.handler.js'] = handlerTemplate(entity, pid);
    backend[name + '.service.js'] = serviceTemplate(entity);
    backend[name + '.repo.js'] = repoTemplate(entity);
  });

  return { frontend, backend };
}
