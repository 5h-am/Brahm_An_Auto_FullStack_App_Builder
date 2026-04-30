function repoTemplate(entity, projectId = 'PROJECT_ID') {
  const name = entity.name;
  const nameLower = name.toLowerCase();

  return `const pool = require('./db');

const ${nameLower}Repo = {
  findAll: async (userId, projectId) => {
    const { rows } = await pool.query(
      'SELECT * FROM app_data WHERE project_id = $1 AND user_id = $2 AND collection_name = $3',
      [projectId, userId, '${nameLower}']
    );
    return rows;
  },
  insert: async (data, userId, projectId) => {
    const { rows } = await pool.query(
      'INSERT INTO app_data (project_id, user_id, collection_name, data) VALUES ($1, $2, $3, $4) RETURNING *',
      [projectId, userId, '${nameLower}', JSON.stringify(data)]
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

module.exports = { ${nameLower}Repo };
`;
}

module.exports = repoTemplate;
