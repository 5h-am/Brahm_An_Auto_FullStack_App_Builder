const { normalize, validate, generateTemplates } = require('../index');

describe('engine malformed input resilience', () => {
  test.each([
    ['normalize(null)', () => normalize(null)],
    ['normalize(undefined)', () => normalize(undefined)],
    ['normalize({})', () => normalize({})],
    ['normalize({ layout: null })', () => normalize({ layout: null })],
    ['normalize({ layout: [{ type: "form" }] })', () => normalize({ layout: [{ type: 'form' }] })],
    ['validate(null, "")', () => validate(null, '')],
    ['validate({}, "{}")', () => validate({}, '{}')],
    ['validate(valid empty config)', () => validate({ layout: [], entities: [] }, '{ "layout": [], "entities": [] }')],
    ['generateTemplates(null)', () => generateTemplates(null)],
    ['generateTemplates({ entities: null })', () => generateTemplates({ entities: null })],
    ['generateTemplates({ entities: [] })', () => generateTemplates({ entities: [] })]
  ])('%s does not throw', (_name, fn) => {
    expect(fn).not.toThrow();
  });

  test('layout item with no id is normalized into a valid config', () => {
    const { config } = normalize({ version: 1, layout: [{ type: 'form' }], entities: [] });
    const result = validate(config, JSON.stringify(config, null, 2));

    expect(config.layout[0].id).toEqual(expect.any(String));
    expect(result.success).toBe(true);
  });
});
