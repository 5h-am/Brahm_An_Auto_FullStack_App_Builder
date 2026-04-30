const { generateTemplates } = require('../templates');

describe('generateTemplates', () => {
  test('returns empty maps for null input', () => {
    expect(generateTemplates(null)).toEqual({ frontend: {}, backend: {} });
  });

  test('returns empty maps when entities is null', () => {
    expect(generateTemplates({ entities: null })).toEqual({ frontend: {}, backend: {} });
  });

  test('returns empty maps when entities is empty', () => {
    expect(generateTemplates({ version: 1, entities: [] })).toEqual({ frontend: {}, backend: {} });
  });

  test('generates frontend and backend files for an entity', () => {
    const output = generateTemplates({
      version: 99,
      entities: [{ name: 'Task', fields: { title: 'string' } }]
    }, 'project-123');

    expect(Object.keys(output.frontend)).toEqual(['TaskView.jsx']);
    expect(Object.keys(output.backend).sort()).toEqual([
      'Task.handler.js',
      'Task.repo.js',
      'Task.service.js'
    ]);
    expect(output.frontend['TaskView.jsx']).toContain('TaskView');
    expect(output.frontend['TaskView.jsx']).toContain('project-123');
    expect(output.frontend['TaskView.jsx']).toContain('version 99');
  });
});
