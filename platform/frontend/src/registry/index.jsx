import { lazy } from 'react';

export const ComponentRegistry = {
  'form':   lazy(() => import('../components/dynamic/Form.jsx')),
  'table':  lazy(() => import('../components/dynamic/Table.jsx')),
  'header': lazy(() => import('../components/dynamic/Header.jsx')),
  'card':   lazy(() => import('../components/dynamic/Card.jsx')),
  'button': lazy(() => import('../components/dynamic/Button.jsx')),
  'input':  lazy(() => import('../components/dynamic/Input.jsx')),
  'text':   lazy(() => import('../components/dynamic/Text.jsx')),
};

export function FallbackComponent({ type }) {
  return (
    <div style={{ border: '1px dashed #E24B4A', padding: '12px', fontSize: '11px', fontFamily: 'monospace' }}>
      Unknown component type: &quot;{type}&quot;
    </div>
  );
}
