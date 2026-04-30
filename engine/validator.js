const { z } = require('zod');

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

const BrahmSchema = z.object({
  version: z.number().default(1),
  theme: ThemeSchema,
  layout: z.array(LayoutItemSchema),
  entities: z.array(EntitySchema)
});

function getLineColumn(rawJsonString, path) {
  const key = String(path[path.length - 1]);
  const searchStr = '"' + key + '"';
  const idx = rawJsonString.indexOf(searchStr);
  if (idx === -1) {
    return { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 };
  }
  const before = rawJsonString.substring(0, idx);
  const lines = before.split('\n');
  const startLineNumber = lines.length;
  const startColumn = lines[lines.length - 1].length + 1;
  const endLineNumber = startLineNumber;
  const endColumn = startColumn + key.length + 2;
  return { startLineNumber, startColumn, endLineNumber, endColumn };
}

function validate(config, rawJsonString) {
  const topResult = BrahmSchema.safeParse(config);

  if (!topResult.success) {
    const errors = topResult.error.errors.map(e => ({ message: e.message, path: e.path }));
    const monacoMarkers = errors.map(e => {
      const loc = getLineColumn(rawJsonString || '', e.path);
      return {
        ...loc,
        message: e.message,
        severity: 8
      };
    });
    return { success: false, data: null, errors, monacoMarkers };
  }

  const validatedConfig = topResult.data;
  const allErrors = [];
  const allMarkers = [];

  const validatedLayout = validatedConfig.layout.map(item => {
    const propsResult = validateProps(item.type, item.props);
    if (!propsResult.success) {
      propsResult.error.errors.forEach(e => {
        const path = ['layout', item.id, 'props', ...e.path];
        const loc = getLineColumn(rawJsonString || '', path);
        allErrors.push({ message: e.message, path });
        allMarkers.push({ ...loc, message: e.message, severity: 8 });
      });
      return item;
    }
    return { ...item, props: propsResult.data };
  });

  if (allErrors.length > 0) {
    return { success: false, data: null, errors: allErrors, monacoMarkers: allMarkers };
  }

  return {
    success: true,
    data: { ...validatedConfig, layout: validatedLayout },
    errors: [],
    monacoMarkers: []
  };
}

module.exports = { validate };
