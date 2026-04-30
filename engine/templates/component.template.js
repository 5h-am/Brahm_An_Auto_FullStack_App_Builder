function componentTemplate(entity, version = 1, projectId = 'PROJECT_ID') {
  const name = entity.name;
  const nameLower = name.toLowerCase();
  const fields = entity.fields || {};
  const fieldNames = Object.keys(fields);

  const initialFormState = fieldNames.map(f => {
    const type = fields[f];
    if (type === 'boolean') return `    ${f}: false`;
    if (type === 'number') return `    ${f}: 0`;
    return `    ${f}: ''`;
  }).join(',\n');

  const thHeaders = fieldNames.map(f => `<th>${f}</th>`).join('');
  const tdCells = fieldNames.map(f => `<td>{String(r.data?.${f} ?? '')}</td>`).join('');

  const formInputs = fieldNames.map(f => {
    const type = fields[f];
    if (type === 'boolean') {
      return `      <label>${f}: <input type="checkbox" checked={form.${f}} onChange={e => setForm(prev => ({ ...prev, ${f}: e.target.checked }))} /></label>`;
    }
    if (type === 'number') {
      return `      <input type="number" value={form.${f}} onChange={e => setForm(prev => ({ ...prev, ${f}: Number(e.target.value) }))} placeholder="${f}" />`;
    }
    return `      <input value={form.${f}} onChange={e => setForm(prev => ({ ...prev, ${f}: e.target.value }))} placeholder="${f}" />`;
  }).join('\n');

  return `import { useState, useEffect } from 'react';

export default function ${name}View() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
${initialFormState}
  });

  useEffect(() => {
    fetch(\`/api/projects/\${projectId}/data/\${nameLower}\`, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('brahm_access_token') }
    }).then(r => r.json()).then(d => setRows(d.data || []));
  }, []);

  function handleSubmit() {
    fetch(\`/api/projects/\${projectId}/data/\${nameLower}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('brahm_access_token') },
      body: JSON.stringify(form)
    }).then(r => r.json()).then(d => setRows(prev => [...prev, d.data]));
  }

  return (
    <div>
      <table>
        <thead><tr>${thHeaders}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>${tdCells}</tr>)}</tbody>
      </table>
${formInputs}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
`;
}

module.exports = componentTemplate;
