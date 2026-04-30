const { validate } = require('../validator');

const validPropsByType = {
  form: { fields: ['name'], submitText: 'Go' },
  table: { columns: ['name'], pageSize: 5, sortable: false },
  header: { title: 'Hello' },
  card: { title: 'Card', body: 'Body' },
  button: { label: 'Press' },
  input: { placeholder: 'Name', name: 'name' },
  text: { content: 'Hello' }
};

const invalidPropsByType = {
  form: { fields: 'name' },
  table: { pageSize: 'ten' },
  header: { title: 123 },
  card: { body: 123 },
  button: { label: 123 },
  input: { name: 123 },
  text: { content: 123 }
};

function configFor(type, props) {
  return {
    version: 1,
    layout: [{ id: `${type}-1`, type, props }],
    entities: []
  };
}

describe('validator starter component schemas', () => {
  test.each(Object.entries(validPropsByType))('%s accepts valid props and fills defaults', (type, props) => {
    const result = validate(configFor(type, props), JSON.stringify(configFor(type, props), null, 2));
    expect(result.success).toBe(true);
    expect(result.data.layout[0].props).toEqual(expect.objectContaining(props));
  });

  test.each(Object.entries(invalidPropsByType))('%s rejects invalid prop type', (type, props) => {
    const result = validate(configFor(type, props), JSON.stringify(configFor(type, props), null, 2));
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test.each(Object.keys(validPropsByType))('%s accepts empty props object with defaults', type => {
    const result = validate(configFor(type, {}), JSON.stringify(configFor(type, {}), null, 2));
    expect(result.success).toBe(true);
    expect(result.data.layout[0].props).toEqual(expect.any(Object));
  });

  test.each(Object.keys(validPropsByType))('%s treats null props as empty object', type => {
    const result = validate(configFor(type, null), JSON.stringify(configFor(type, null), null, 2));
    expect(result.success).toBe(true);
    expect(result.data.layout[0].props).toEqual(expect.any(Object));
  });

  test('form unknown props are stripped by the Zod object schema', () => {
    const result = validate(configFor('form', { fields: [], submitText: 'Go', unknownProp: 123 }), '');
    expect(result.success).toBe(true);
    expect(result.data.layout[0].props).toEqual({ fields: [], submitText: 'Go' });
  });

  test('unknown component type uses GenericPropsSchema and accepts arbitrary props', () => {
    const result = validate(configFor('chart', { data: [], nested: { ok: true } }), '');
    expect(result.success).toBe(true);
    expect(result.data.layout[0].props).toEqual({ data: [], nested: { ok: true } });
  });

  test.each(Object.keys(validPropsByType))('%s does not fall through to GenericPropsSchema', type => {
    const result = validate(configFor(type, invalidPropsByType[type]), '');
    expect(result.success).toBe(false);
  });
});

describe('validator Monaco markers', () => {
  test('schema errors produce Monaco marker shape with severity 8', () => {
    const raw = JSON.stringify({ version: 1, layout: [{ id: 'bad' }], entities: [] }, null, 2);
    const result = validate(JSON.parse(raw), raw);

    expect(result.success).toBe(false);
    expect(result.monacoMarkers.length).toBeGreaterThan(0);
    for (const marker of result.monacoMarkers) {
      expect(marker).toEqual(expect.objectContaining({
        startLineNumber: expect.any(Number),
        startColumn: expect.any(Number),
        endLineNumber: expect.any(Number),
        endColumn: expect.any(Number),
        message: expect.any(String),
        severity: 8
      }));
      expect(marker.startLineNumber).toBeGreaterThanOrEqual(1);
      expect(marker.startColumn).toBeGreaterThanOrEqual(1);
    }
  });

  test('missing raw JSON key falls back to line 1 column 1 without throwing', () => {
    const result = validate(configFor('table', { pageSize: 'ten' }), '{"version":1,"layout":[],"entities":[]}');
    expect(result.success).toBe(false);
    expect(result.monacoMarkers[0].startLineNumber).toBe(1);
    expect(result.monacoMarkers[0].startColumn).toBe(1);
  });
});
