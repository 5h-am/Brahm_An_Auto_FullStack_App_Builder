const { normalize } = require('../normalizer');
const { DEFAULT_TOKENS } = require('../constants');

describe('normalizer shorthand expansion', () => {
  const shorthands = {
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

  test.each(Object.entries(shorthands))('%s expands to %s', (shortKey, fullKey) => {
    const { config, engineWarnings } = normalize({
      version: 1,
      layout: [],
      entities: [],
      [shortKey]: 'value'
    });

    expect(config[fullKey]).toBe('value');
    expect(config).not.toHaveProperty(shortKey);
    expect(engineWarnings).toEqual([]);
  });

  test('unknown short key is left unchanged and warns once', () => {
    const { config, engineWarnings } = normalize({
      version: 1,
      layout: [],
      entities: [],
      xyz: 'value'
    });

    expect(config.xyz).toBe('value');
    expect(engineWarnings).toHaveLength(1);
    expect(engineWarnings[0]).toContain("Unknown shorthand key 'xyz'");
  });

  test('config with zero shorthands passes through without warnings', () => {
    const input = { version: 1, layout: [], entities: [], name: 'Plain' };
    const { config, engineWarnings } = normalize(input);

    expect(config.name).toBe('Plain');
    expect(engineWarnings).toEqual([]);
  });

  test('deeply nested shorthand-like keys are not expanded', () => {
    const { config } = normalize({
      version: 1,
      layout: [{ id: 'txt', type: 'text', props: { t: 'Nested' } }],
      entities: []
    });

    expect(config.layout[0].props.t).toBe('Nested');
    expect(config.layout[0].props).not.toHaveProperty('text');
  });
});

describe('normalizer default injection', () => {
  test('layout item with no id receives a non-empty id', () => {
    const { config } = normalize({ version: 1, layout: [{ type: 'text' }], entities: [] });
    expect(config.layout[0].id).toEqual(expect.any(String));
    expect(config.layout[0].id.length).toBeGreaterThan(0);
  });

  test('two items with no id receive unique ids across repeated runs', () => {
    for (let i = 0; i < 100; i += 1) {
      const { config } = normalize({
        version: 1,
        layout: [{ type: 'text' }, { type: 'button' }],
        entities: []
      });
      expect(config.layout[0].id).not.toBe(config.layout[1].id);
    }
  });

  test('form defaults are injected without overwriting submitText', () => {
    expect(normalize({ version: 1, layout: [{ type: 'form', props: {} }], entities: [] }).config.layout[0].props).toMatchObject({
      submitText: 'Submit',
      fields: []
    });

    expect(normalize({ version: 1, layout: [{ type: 'form', props: { submitText: 'Save' } }], entities: [] }).config.layout[0].props.submitText).toBe('Save');
  });

  test('table defaults are injected', () => {
    const { config } = normalize({ version: 1, layout: [{ type: 'table', props: {} }], entities: [] });
    expect(config.layout[0].props).toMatchObject({
      pageSize: 10,
      sortable: true,
      columns: []
    });
  });

  test('button label default is injected', () => {
    const { config } = normalize({ version: 1, layout: [{ type: 'button', props: {} }], entities: [] });
    expect(config.layout[0].props.label).toBe('Click');
  });

  test('missing theme injects all default tokens', () => {
    const { config } = normalize({ version: 1, layout: [], entities: [] });
    expect(config.theme.tokens).toEqual(DEFAULT_TOKENS);
  });

  test('theme without tokens preserves existing theme keys and injects tokens', () => {
    const { config } = normalize({ version: 1, layout: [], entities: [], theme: { mode: 'custom' } });
    expect(config.theme.mode).toBe('custom');
    expect(config.theme.tokens).toEqual(DEFAULT_TOKENS);
  });

  test('complete theme tokens are not overwritten', () => {
    const tokens = Object.fromEntries(Object.keys(DEFAULT_TOKENS).map(key => [key, `custom-${key}`]));
    const { config } = normalize({ version: 1, layout: [], entities: [], theme: { tokens } });
    expect(config.theme.tokens).toEqual(tokens);
  });
});
