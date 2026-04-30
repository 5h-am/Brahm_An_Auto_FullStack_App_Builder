import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Editor from '@monaco-editor/react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';
import 'highlight.js/styles/github.css';
import useBuilderStore from '../store/builderStore';
import { ComponentRegistry } from '../registry/index.jsx';
import { apiFetch, BASE_URL } from '../hooks/useFetch';
import { normalize, validate, generateTemplates } from '@brahm/engine';
import { EXAMPLE_CONFIGS } from '../data/exampleConfigs';
import Papa from 'papaparse';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('xml', xml);

const PALETTE_ITEMS = [
  { display: 'Form', type: 'form', color: '#e6f1fb' },
  { display: 'Table', type: 'table', color: '#e6fbf1' },
  { display: 'Header', type: 'header', color: '#f1e6fb' },
  { display: 'Card', type: 'card', color: '#fbe6e6' },
  { display: 'Button', type: 'button', color: '#fbf1e6' },
  { display: 'Input', type: 'input', color: '#e6fbe6' },
  { display: 'Text', type: 'text', color: '#f9f9f9' },
];

function snippetFor(type) {
  const snippets = {
    form: { id: '', type: 'form', props: { fields: [], submitText: 'Submit' }, actions: {} },
    table: { id: '', type: 'table', props: { columns: [], pageSize: 10, sortable: true }, actions: {} },
    header: { id: '', type: 'header', props: { title: 'My Header' }, actions: {} },
    card: { id: '', type: 'card', props: { title: 'Card Title', body: '' }, actions: {} },
    button: { id: '', type: 'button', props: { label: 'Click Me' }, actions: {} },
    input: { id: '', type: 'input', props: { placeholder: 'Enter value', name: 'field1' }, actions: {} },
    text: { id: '', type: 'text', props: { content: 'Hello world' }, actions: {} },
  };
  return snippets[type];
}

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${p => p.theme.shellBg};
  color: ${p => p.theme.textPrimary};
  font-family: ${p => p.theme.fontSystem};
`;

const Topbar = styled.div`
  height: 44px;
  border-bottom: 1px solid ${p => p.theme.divider};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
`;

const TopLeft = styled.div`
  display: flex;
  align-items: center;
`;

const TopRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Wordmark = styled.span`
  color: ${p => p.theme.accent};
  font-weight: 500;
  font-size: 15px;
`;

const BetaPill = styled.span`
  background: #e6f1fb;
  color: #0c447c;
  font-size: 11px;
  border-radius: 4px;
  padding: 2px 6px;
  margin-left: 8px;
`;

const Breadcrumb = styled.span`
  color: ${p => p.theme.textSecondary};
  font-size: 12px;
  margin-left: 16px;
`;

const Navlink = styled.span`
  color: ${p => p.theme.textSecondary};
  font-size: 12px;
  cursor: pointer;
  &:hover { color: ${p => p.theme.textPrimary}; }
`;

const IconBtn = styled.button`
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: ${p => p.theme.textSecondary};
  border-radius: 4px;
  &:active { transform: scale(0.98); }
`;

const GhostBtn = styled.button`
  padding: 6px 12px;
  border: 1px solid ${p => p.theme.divider};
  background: transparent;
  color: ${p => p.theme.textPrimary};
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  font-family: ${p => p.theme.fontSystem};
  &:active { transform: scale(0.98); }
`;

const FilledBtn = styled.button`
  padding: 6px 12px;
  border: none;
  background: ${p => p.theme.accent};
  color: #ffffff;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  font-family: ${p => p.theme.fontSystem};
  &:active { transform: scale(0.98); }
`;

const StatusBar = styled.div`
  height: 32px;
  background: ${p => p.theme.sidebarBg};
  border-bottom: 1px solid ${p => p.theme.divider};
  display: flex;
  align-items: center;
  padding: 0 16px;
  flex-shrink: 0;
  font-size: 12px;
`;

const StatusDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
  background: ${p => p.$color};
`;

const StatusText = styled.span`
  color: ${p => p.theme.textSecondary};
  font-size: 12px;
`;

const WarningPill = styled.span`
  color: ${p => p.theme.warning};
  font-size: 11px;
  margin-left: 12px;
`;

const StackTag = styled.span`
  margin-left: auto;
  background: #e6f1fb;
  color: #0c447c;
  font-size: 11px;
  border-radius: 4px;
  padding: 2px 6px;
`;

const MainArea = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 200px;
  border-right: 1px solid ${p => p.theme.divider};
  overflow-y: auto;
  flex-shrink: 0;
  background: ${p => p.theme.sidebarBg};
  padding: 12px 0;
`;

const SectionLabel = styled.div`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${p => p.theme.textMuted};
  padding: 8px 12px 4px;
`;

const PaletteItem = styled.div`
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 12px;
  cursor: grab;
  font-size: 13px;
  color: ${p => p.theme.textPrimary};
  &:active { cursor: grabbing; transform: scale(0.98); }
`;

const IconTile = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 4px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  background: ${p => p.$bg};
  color: ${p => p.theme.textSecondary};
`;

const PageItem = styled.div`
  padding: 6px 12px;
  font-size: 13px;
  border-left: 2px solid ${p => p.theme.accent};
  margin: 0 12px;
  color: ${p => p.theme.textPrimary};
`;

const RegistryKey = styled.div`
  font-family: ${p => p.theme.fontMono};
  font-size: 10px;
  padding: 2px 12px;
  color: ${p => p.theme.textMuted};
`;

const EditorPane = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const RightPane = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid ${p => p.theme.divider};
`;

const TabBar = styled.div`
  display: flex;
  border-bottom: 1px solid ${p => p.theme.divider};
  flex-shrink: 0;
`;

const TabBtn = styled.button`
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: ${p => p.$active ? p.theme.accent : p.theme.textSecondary};
  font-size: 12px;
  cursor: pointer;
  border-bottom: 2px solid ${p => p.$active ? p.theme.accent : 'transparent'};
  font-family: ${p => p.theme.fontSystem};
  &:active { transform: scale(0.98); }
`;

const PreviewContainer = styled.div`
  flex: 1;
  background: ${p => p.theme.previewBg};
  display: flex;
  overflow: hidden;
  position: relative;
`;

const PreviewIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

const PreviewEmpty = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: ${p => p.theme.textMuted};
  font-size: 13px;
`;

const CodeContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  background: ${p => p.theme.previewBg};
  font-size: 13px;
  color: ${p => p.theme.textMuted};
`;

const CodeFile = styled.div`
  border-bottom: 1px solid ${p => p.theme.divider};
`;

const CodeFileHeader = styled.div`
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 600;
  font-family: ${p => p.theme.fontMono};
  color: ${p => p.theme.textSecondary};
  background: ${p => p.theme.shellBg};
  border-bottom: 1px solid ${p => p.theme.divider};
  text-transform: none;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const CodeBlock = styled.pre`
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: pre;
  max-width: 100%;
  font-family: ${p => p.theme.fontMono};
  font-size: 12px;
  line-height: 1.6;
  background: ${p => p.theme.previewBg};
  & code {
    background: transparent;
    font-family: inherit;
  }
`;

const CodeEmpty = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${p => p.theme.textMuted};
  font-size: 13px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalBox = styled.div`
  background: ${p => p.theme.shellBg};
  border: 1px solid ${p => p.theme.divider};
  border-radius: 8px;
  padding: 24px;
  width: 360px;
`;

const ExampleBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 200;
`;

const ExamplePanel = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 340px;
  height: 100vh;
  background: ${p => p.theme.shellBg};
  border-left: 1px solid ${p => p.theme.divider};
  z-index: 201;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ExamplePanelHeader = styled.div`
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid ${p => p.theme.divider};
  flex-shrink: 0;
`;

const ExamplePanelTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${p => p.theme.textPrimary};
`;

const ClosePanelBtn = styled.button`
  font-size: 13px;
  color: ${p => p.theme.textSecondary};
  border: none;
  background: transparent;
  cursor: pointer;
`;

const ExampleList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

const ExampleCard = styled.div`
  padding: 12px;
  border: 1px solid ${p => p.theme.divider};
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  background: ${p => p.theme.shellBg};

  &:hover {
    background: ${p => p.theme.sidebarBg};
  }
`;

const ExampleName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${p => p.theme.textPrimary};
`;

const ExampleDesc = styled.div`
  font-size: 11px;
  color: ${p => p.theme.textSecondary};
  margin-top: 4px;
  line-height: 1.5;
`;

const EntityPill = styled.div`
  background: #e6f1fb;
  color: #0c447c;
  font-size: 10px;
  font-family: monospace;
  border-radius: 3px;
  padding: 2px 5px;
  margin-right: 4px;
  margin-top: 6px;
  display: inline-block;
`;

const ModalTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: ${p => p.theme.textPrimary};
`;

const ModalTextarea = styled.textarea`
  flex: 1;
  min-height: 300px;
  padding: 12px;
  border: 1px solid ${p => p.theme.divider};
  border-radius: 4px;
  font-family: ${p => p.theme.fontMono};
  font-size: 12px;
  resize: none;
  background: ${p => p.theme.shellBg};
  color: ${p => p.theme.textPrimary};
  margin-bottom: 12px;
`;

const ModalBtnRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const EditorDropZone = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const PREVIEW_SRCDOC = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background: #f4f4f4; padding: 16px; }
.brahm-error { border: 1px solid #E24B4A; padding: 12px; font-size: 11px; font-family: monospace; color: #E24B4A; margin: 8px 0; }
.brahm-fallback { border: 1px dashed #E24B4A; padding: 12px; font-size: 11px; font-family: monospace; margin: 8px 0; }
.brahm-form { display: flex; flex-direction: column; gap: 8px; padding: 16px; background: #fff; border: 1px solid #e5e5e5; border-radius: 4px; margin: 8px 0; }
.brahm-form input { padding: 8px; border: 1px solid #e5e5e5; border-radius: 4px; font-size: 13px; }
.brahm-form label { font-size: 11px; color: #6b6b6b; display: flex; flex-direction: column; gap: 4px; }
.brahm-form button { padding: 8px 16px; background: #1a3a5c; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; align-self: flex-start; }
.brahm-form button:active { transform: scale(0.98); }
.brahm-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e5e5; border-radius: 4px; margin: 8px 0; overflow: hidden; font-size: 13px; }
.brahm-table th { background: #f9f9f9; padding: 8px 12px; text-align: left; font-weight: 500; border-bottom: 1px solid #e5e5e5; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b6b6b; }
.brahm-table td { padding: 8px 12px; border-bottom: 1px solid #f4f4f4; color: #0a0a0a; }
.brahm-table tr:last-child td { border-bottom: none; }
.brahm-table .empty { padding: 24px; text-align: center; color: #a3a3a3; font-size: 12px; }
.brahm-header { background: #1a3a5c; color: #fff; padding: 0 16px; height: 40px; display: flex; align-items: center; margin: -16px -16px 16px -16px; }
.brahm-header h1 { font-size: 15px; font-weight: 500; }
.brahm-card { background: #fff; border: 1px solid #e5e5e5; border-radius: 4px; padding: 16px; margin: 8px 0; }
.brahm-card h2 { font-size: 13px; font-weight: 500; margin-bottom: 8px; }
.brahm-card p { font-size: 13px; color: #6b6b6b; line-height: 1.6; }
.brahm-button { padding: 8px 16px; background: #1a3a5c; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; margin: 8px 0; display: inline-block; }
.brahm-button:active { transform: scale(0.98); }
.brahm-input { display: flex; flex-direction: column; gap: 4px; margin: 8px 0; }
.brahm-input label { font-size: 11px; color: #6b6b6b; }
.brahm-input input { padding: 8px; border: 1px solid #e5e5e5; border-radius: 4px; font-size: 13px; }
.brahm-text { font-size: 13px; color: #0a0a0a; line-height: 1.6; margin: 8px 0; }
</style>
</head>
<body>
<div id="brahm-root"></div>
<script src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js"><\/script>
<script>
var DEFAULT_TOKENS = {
  primary: '#1a3a5c', background: '#ffffff', surface: '#f9f9f9',
  divider: '#e5e5e5', textPrimary: '#0a0a0a', textSecondary: '#6b6b6b',
  success: '#1D9E75', warning: '#D97706', error: '#E24B4A',
  radius: '4px', spacing: '8px'
};

var _reactRoot = null;
var _cachedToken = '';
var _cachedConfig = null;
var _translations = {};
var _currentLocale = 'en';
var _lastConfig = null;

function t(key) {
  var localeMap = _translations[_currentLocale] || _translations['en'] || {};
  return localeMap[key] !== undefined ? localeMap[key] : key;
}

function BrahmHeader(props) {
  var config = props.config || {};
  return React.createElement('header', { className: 'brahm-header' },
    React.createElement('h1', null, config.title || 'Header')
  );
}

function BrahmCard(props) {
  var config = props.config || {};
  return React.createElement('div', { className: 'brahm-card' },
    React.createElement('h2', null, config.title || ''),
    React.createElement('p', null, config.body || '')
  );
}

function BrahmText(props) {
  var config = props.config || {};
  return React.createElement('p', { className: 'brahm-text' }, config.content || '');
}

function BrahmButton(props) {
  var config = props.config || {};
  var onAction = props.onAction || function() {};
  return React.createElement('button', {
    className: 'brahm-button',
    onClick: function() { onAction('buttonClick', {}); }
  }, config.label || 'Click');
}

function BrahmInput(props) {
  var config = props.config || {};
  var onAction = props.onAction || function() {};
  var ref = React.useRef(null);
  return React.createElement('div', { className: 'brahm-input' },
    React.createElement('label', null, config.name || 'Input'),
    React.createElement('input', {
      ref: ref,
      placeholder: config.placeholder || '',
      onChange: function(e) { onAction('inputChange', { name: config.name, value: e.target.value }); }
    })
  );
}

function coercePayload(fields, formData, entityFields) {
  const result = {};
  for (const fieldName of fields) {
    const rawValue = formData[fieldName];
    const declaredType = entityFields ? entityFields[fieldName] : 'string';
    
    if (declaredType === 'number') {
      const parsed = Number(rawValue);
      result[fieldName] = isNaN(parsed) ? 0 : parsed;
    } else if (declaredType === 'boolean') {
      result[fieldName] = rawValue === 'true' || rawValue === true;
    } else {
      result[fieldName] = rawValue === undefined || rawValue === null ? '' : String(rawValue);
    }
  }
  return result;
}

function buildInitialFormState(fields, entityFields) {
  var state = {};
  for (var i = 0; i < fields.length; i++) {
    var f = fields[i];
    var t = entityFields && entityFields[f];
    state[f] = t === 'boolean' ? 'false' : '';
  }
  return state;
}

function BrahmForm(props) {
  var config = props.config || {};
  var onAction = props.onAction || function() {};
  var entityFields = props.entityFields;
  var fields = config.fields || [];
  var submitText = config.submitText || 'Submit';
  var submitAction = (config.actions && config.actions.onSubmit) ? config.actions.onSubmit : null;

  var state = React.useState(buildInitialFormState(fields, entityFields || {}));
  var formState = state[0];
  var setFormState = state[1];

  var errState = React.useState(null);
  var formError = errState[0];
  var setFormError = errState[1];

  function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    if (submitAction) {
      var coerced = coercePayload(fields, formState, entityFields || {});
      onAction(submitAction, coerced, function(err) {
        setFormError(err);
      });
    }
  }

  return React.createElement('form', { className: 'brahm-form', onSubmit: handleSubmit },
    fields.map(function(fieldName) {
      var type = entityFields ? entityFields[fieldName] : 'string';
      
      if (type === 'boolean') {
        return React.createElement('div', { key: fieldName, style: { display: 'flex', gap: '12px', alignItems: 'center', padding: '4px 0', marginBottom: '8px' } },
          React.createElement('label', { style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' } },
            React.createElement('input', {
              type: 'radio',
              name: fieldName,
              value: 'true',
              checked: formState[fieldName] === 'true' || formState[fieldName] === true,
              onChange: function() { setFormState(function(prev) { var n = Object.assign({}, prev); n[fieldName] = 'true'; return n; }); }
            }),
            'True'
          ),
          React.createElement('label', { style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' } },
            React.createElement('input', {
              type: 'radio',
              name: fieldName,
              value: 'false',
              checked: formState[fieldName] === 'false' || formState[fieldName] === false || formState[fieldName] === undefined,
              onChange: function() { setFormState(function(prev) { var n = Object.assign({}, prev); n[fieldName] = 'false'; return n; }); }
            }),
            'False'
          )
        );
      }
      
      if (type === 'number') {
        return React.createElement('label', { key: fieldName },
          fieldName,
          React.createElement('input', {
            type: 'number',
            min: '-999999',
            step: '1',
            value: formState[fieldName] || '',
            placeholder: fieldName,
            onChange: function(e) {
              var v = e.target.value;
              setFormState(function(prev) {
                var next = Object.assign({}, prev);
                next[fieldName] = v;
                return next;
              });
            }
          })
        );
      }

      return React.createElement('label', { key: fieldName },
        fieldName,
        React.createElement('input', {
          type: 'text',
          value: formState[fieldName] || '',
          placeholder: fieldName,
          onChange: function(e) {
            var v = e.target.value;
            setFormState(function(prev) {
              var next = Object.assign({}, prev);
              next[fieldName] = v;
              return next;
            });
          }
        })
      );
    }),
    React.createElement('button', { type: 'submit' }, submitText),
    formError ? React.createElement('div', {
      style: {
        color: '#E24B4A',
        fontSize: '12px',
        marginTop: '8px',
        padding: '8px',
        border: '1px solid #E24B4A',
        borderRadius: '4px',
        background: '#fef2f2'
      }
    }, formError) : null
  );
}

function BrahmTable(props) {
  var config = props.config || {};
  var data = props.data;
  var columns = config.columns || [];
  var rows = Array.isArray(data) ? data : [];

  return React.createElement('table', { className: 'brahm-table' },
    React.createElement('thead', null,
      React.createElement('tr', null,
        columns.map(function(col) {
          return React.createElement('th', { key: col }, col);
        })
      )
    ),
    React.createElement('tbody', null,
      rows.length === 0
        ? React.createElement('tr', null, React.createElement('td', { colSpan: columns.length, className: 'empty' }, 'No data yet'))
        : rows.map(function(row, i) {
            var rowData = row.data || row;
            return React.createElement('tr', { key: row.id || i },
              columns.map(function(col) {
                return React.createElement('td', { key: col }, String(rowData[col] != null ? rowData[col] : ''));
              })
            );
          })
    )
  );
}

function FallbackComponent(props) {
  return React.createElement('div', { className: 'brahm-fallback' }, 'Unknown component: "' + props.type + '"');
}

var COMPS = {
  header: BrahmHeader,
  card: BrahmCard,
  text: BrahmText,
  button: BrahmButton,
  input: BrahmInput,
  form: BrahmForm,
  table: BrahmTable
};

function stateReducer(state, action) {
  var next = Object.assign({}, state);
  next[action.id] = Object.assign({}, state[action.id], action.patch);
  return next;
}

function buildInitialState(layout) {
  var s = {};
  (layout || []).forEach(function(item) {
    s[item.id] = { data: null, isLoading: false, isError: false };
  });
  return s;
}

function buildAPIRegistry(entities, projectId) {
  var registry = {};
  (entities || []).forEach(function(entity) {
    var name = entity.name;
    var base = '/api/projects/' + projectId + '/data/' + name.toLowerCase();
    var headers = function() {
      return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + _cachedToken };
    };
    registry['create' + name] = function(payload) {
      return fetch(base, { method: 'POST', headers: headers(), body: JSON.stringify(payload) }).then(function(r) { return r.json(); });
    };
    registry['read' + name] = function() {
      return fetch(base, { headers: headers() }).then(function(r) { return r.json(); });
    };
    registry['update' + name] = function(payload) {
      return fetch(base + '/' + payload.id, { method: 'PUT', headers: headers(), body: JSON.stringify(payload) }).then(function(r) { return r.json(); });
    };
    registry['delete' + name] = function(id) {
      return fetch(base + '/' + id, { method: 'DELETE', headers: headers() }).then(function(r) { return r.json(); });
    };
  });
  return registry;
}

function AppRoot(props) {
  var config = props.config;
  var layout = config.layout || [];
  var entities = config.entities || [];
  var projectId = config._projectId || '';

  function resolveProps(props) {
    if (!props || typeof props !== 'object') return props;
    var resolved = {};
    var keys = Object.keys(props);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var v = props[k];
      if (typeof v === 'string' && v.indexOf('t:') === 0) {
        resolved[k] = t(v.slice(2));
      } else {
        resolved[k] = v;
      }
    }
    return resolved;
  }

  function switchLocale(locale) {
    _currentLocale = locale;
    _reactRoot.render(React.createElement(AppRoot, { config: config }));
  }

  var stateResult = React.useReducer(stateReducer, layout, buildInitialState);
  var state = stateResult[0];
  var dispatch = stateResult[1];

  var actionsRef = React.useRef(null);
  if (!actionsRef.current) {
    actionsRef.current = buildAPIRegistry(entities, projectId);
  }
  var actions = actionsRef.current;

  React.useEffect(function() {
    function handleRefresh(e) {
      var entityName = e.detail.entity;
      var rows = e.detail.data;
      config.layout.forEach(function(item) {
        if (item.type === 'table' && item.props && item.props._entity === entityName) {
          dispatch({ id: item.id, patch: { data: rows, isLoading: false, isError: false } });
        }
      });
      // Fallback: refresh all table items if no _entity match
      config.layout.forEach(function(item) {
        if (item.type === 'table') {
          dispatch({ id: item.id, patch: { data: rows, isLoading: false, isError: false } });
        }
      });
    }
    window.addEventListener('brahm:dataRefreshed', handleRefresh);
    return function() { window.removeEventListener('brahm:dataRefreshed', handleRefresh); };
  }, [config]);

  var appErrorState = React.useState(null);
  var appError = appErrorState[0];
  var setAppError = appErrorState[1];

  function getEntityFields(configObj, formFields) {
    if (!configObj.entities || !formFields) return {};
    for (var i = 0; i < configObj.entities.length; i++) {
      var entity = configObj.entities[i];
      var entityFieldKeys = Object.keys(entity.fields);
      var allMatch = formFields.every(function(f) { return entityFieldKeys.includes(f); });
      if (allMatch) {
        return entity.fields;
      }
    }
    return {};
  }

  React.useEffect(function() {
    entities.forEach(function(entity) {
      var readFn = actions['read' + entity.name];
      var tableItem = layout.find(function(item) { return item.type === 'table'; });
      if (readFn && tableItem) {
        dispatch({ id: tableItem.id, patch: { isLoading: true } });
        readFn().then(function(result) {
          if (result && result.success) {
            dispatch({ id: tableItem.id, patch: { data: result.data, isLoading: false } });
          } else {
            dispatch({ id: tableItem.id, patch: { isLoading: false, isError: true } });
            setAppError(result && result.error ? result.error : 'Failed to load table data.');
          }
        }).catch(function(err) {
          dispatch({ id: tableItem.id, patch: { isLoading: false, isError: true } });
          setAppError('Network error: ' + (err.message || 'Could not reach the server.'));
        });
      }
    });
  }, []);

  function handleAction(actionName, payload, onError) {
    var fn = actions[actionName];
    if (!fn) {
      if (onError) onError('Action "' + actionName + '" is not defined in the API registry. Check your entities config.');
      return;
    }

    fn(payload).then(function(result) {
      if (result && result.success === false) {
        if (onError) onError(result.error || 'Server returned an error. Check your config and data types.');
        return;
      }
      if (!result || !result.success) return;

      var entityName = actionName.replace(/^(create|update|delete)/, '');
      var readFn = actions['read' + entityName];
      var tableItem = layout.find(function(item) { return item.type === 'table'; });

      if (readFn && tableItem) {
        readFn().then(function(readResult) {
          if (readResult && readResult.success) {
            dispatch({ id: tableItem.id, patch: { data: readResult.data, isLoading: false } });
          }
        });
      }
    }).catch(function(err) {
      if (onError) onError('Network error: ' + (err.message || 'Could not reach the server.'));
    });
  }

  var theme = config.theme && config.theme.tokens ? config.theme.tokens : DEFAULT_TOKENS;

  return React.createElement('div', { style: { position: 'relative', minHeight: '100vh' } },
    (config.i18n && config.i18n.locales && config.i18n.locales.length > 1) ? React.createElement('div', {
      style: { 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        background: theme.background || '#ffffff', 
        borderBottom: '1px solid ' + (theme.divider || '#e5e5e5'), 
        padding: '6px 16px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        fontSize: '11px',
        color: theme.textSecondary || '#6b6b6b'
      }
    },
      React.createElement('span', null, '🌐'),
      config.i18n.locales.map(function(locale) {
        var isActive = locale === _currentLocale;
        return React.createElement('button', {
          key: locale,
          onClick: function() { switchLocale(locale); },
          style: {
            padding: '2px 8px',
            fontSize: '11px',
            borderRadius: '4px',
            border: '1px solid ' + (theme.divider || '#e5e5e5'),
            background: isActive ? (theme.primary || '#1a3a5c') : 'transparent',
            color: isActive ? '#ffffff' : (theme.textSecondary || '#6b6b6b'),
            cursor: 'pointer'
          }
        }, locale.toUpperCase());
      })
    ) : null,
    appError ? React.createElement('div', {
      style: {
        background: '#fef2f2',
        border: '1px solid #E24B4A',
        borderRadius: '4px',
        padding: '8px 12px',
        fontSize: '12px',
        color: '#E24B4A',
        margin: '0 0 16px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    },
      appError,
      React.createElement('button', {
        onClick: function() { setAppError(null); },
        style: { background: 'none', border: 'none', cursor: 'pointer', color: '#E24B4A', fontWeight: '500', fontSize: '12px' }
      }, '✕')
    ) : null,
    React.createElement('div', { style: { padding: '16px' } },
      layout.map(function(item) {
        var Comp = COMPS[item.type] || FallbackComponent;
        var itemState = state[item.id] || { data: null, isLoading: false, isError: false };
        var resolved = resolveProps(item.props || {});
        var mergedConfig = Object.assign({}, resolved, { actions: item.actions || {} });
        var extraProps = item.type === 'form' ? { entityFields: getEntityFields(config, item.props ? item.props.fields : []) } : {};

        return React.createElement(Comp, Object.assign({
          key: item.id,
          type: item.type,
          data: itemState.data,
          config: mergedConfig,
          onAction: handleAction,
          isLoading: itemState.isLoading,
          isError: itemState.isError
        }, extraProps));
      })
    )
  );
}

function bootstrapApp(config) {
  _lastConfig = config;
  _cachedToken = config._accessToken || '';
  _translations = (config.i18n && config.i18n.translations) ? config.i18n.translations : {};
  _currentLocale = config._currentLocale || (config.i18n && config.i18n.default) || 'en';

  if (!_reactRoot) {
    _reactRoot = ReactDOM.createRoot(document.getElementById('brahm-root'));
  }
  _reactRoot.render(React.createElement(AppRoot, { config: config }));
}

window.addEventListener('message', function(event) {
  if (!event.data) return;
  if (event.data.type === 'CONFIG_UPDATE') {
    bootstrapApp(event.data.payload);
  }
  if (event.data.type === 'DATA_REFRESH') {
    var entityName = event.data.payload.entity;
    if (!_lastConfig || !_lastConfig.entities) return;
    var entity = _lastConfig.entities.find(function(e) { return e.name.toLowerCase() === entityName; });
    if (!entity) return;
    var actions = buildAPIRegistry(_lastConfig.entities, _lastConfig._projectId || '');
    var readKey = 'read' + entity.name;
    if (actions[readKey]) {
      actions[readKey]().then(function(res) {
        window.dispatchEvent(new CustomEvent('brahm:dataRefreshed', { detail: { entity: entityName, data: res.data || [] } }));
      });
    }
  }
});
</script>
</body>
</html>`;

const DOCKER_COMPOSE_CONTENT = `version: '3.8'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: brahm_db
      POSTGRES_USER: brahm
      POSTGRES_PASSWORD: brahm_secret
    ports:
      - "5432:5432"
  backend:
    build:
      context: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://brahm:brahm_secret@db:5432/brahm_db
      PORT: 3001
    depends_on:
      - db
  frontend:
    build:
      context: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
`;

function generateReadme(config, projectName) {
  const entities = (config.entities || []).map(e => `- ${e.name}: ${Object.keys(e.fields).join(', ')}`).join('\n');
  return `# ${projectName || 'Brahm App'}

Generated by Brahm.

## Entities
${entities || 'No entities defined.'}

## Getting Started
1. Run \`docker-compose up\` to start the database, backend, and frontend.
2. The backend will be available at http://localhost:3001
3. The frontend will be available at http://localhost:5173
`;
}

export default function BuilderPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const debounceRef = useRef(null);
  const iframeRef = useRef(null);
  const rawConfigRef = useRef('');
  const iframeLoadedRef = useRef(false);
  const normalizedConfigRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [projectName, setProjectName] = useState('...');
  const [isExamplePanelOpen, setIsExamplePanelOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('en');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvMapping, setCsvMapping] = useState({});
  const [csvSelectedEntity, setCsvSelectedEntity] = useState('');
  const [csvStep, setCsvStep] = useState(1);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvError, setCsvError] = useState(null);
  const [isGithubModalOpen, setIsGithubModalOpen]   = useState(false);
  const [githubRepoName, setGithubRepoName]           = useState('');
  const [githubIsPrivate, setGithubIsPrivate]         = useState(true);
  const [githubPushStatus, setGithubPushStatus]       = useState('idle');
  const [githubPushError, setGithubPushError]         = useState(null);
  const [githubRepoUrl, setGithubRepoUrl]             = useState(null);
  const [githubCredentials, setGithubCredentials]     = useState(null);
  const [githubCredLoading, setGithubCredLoading]     = useState(false);
  const [githubPatInput, setGithubPatInput]           = useState('');
  const [githubPatSaveError, setGithubPatSaveError]   = useState(null);
  const [githubPatSaving, setGithubPatSaving]         = useState(false);

  const {
    normalizedConfig, validationErrors, monacoMarkers,
    engineWarnings, activeTab, isDarkMode,
    generatedFrontendCode, generatedBackendCode, pendingConfig,
    setNormalizedConfig, setValidationErrors,
    setMonacoMarkers, setEngineWarnings, setActiveTab, toggleDarkMode,
    setGeneratedFrontendCode, setGeneratedBackendCode, setPendingConfig,
    resetBuilderState
  } = useBuilderStore();

  useEffect(() => {
    apiFetch('/api/projects/' + projectId)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setProjectName(d.data.name);
          const cfg = d.data.config;
          if (cfg && Object.keys(cfg).length > 0) {
            const jsonStr = JSON.stringify(cfg, null, 2);
            rawConfigRef.current = jsonStr;
            if (editorRef.current) {
              editorRef.current.setValue(jsonStr);
            }
          }
        }
      })
      .catch(() => { });

    return () => {
      resetBuilderState();
    };
  }, [projectId]);

  useEffect(() => {
    if (!isGithubModalOpen) return;
    setGithubCredLoading(true);
    apiFetch('/api/github/credentials')
      .then(r => r.json())
      .then(data => {
        setGithubCredentials(data.data);
      })
      .catch(() => {
        setGithubCredentials(null);
      })
      .finally(() => {
        setGithubCredLoading(false);
      });
  }, [isGithubModalOpen]);

  useEffect(() => {
    if (!normalizedConfig || !iframeRef.current?.contentWindow || !iframeLoadedRef.current) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: 'CONFIG_UPDATE',
        payload: {
          ...normalizedConfig,
          _projectId: projectId,
          _accessToken: localStorage.getItem('brahm_access_token') || '',
          _currentLocale: currentLocale
        }
      },
      '*'
    );
  }, [normalizedConfig, currentLocale]);

  useEffect(() => {
    if (!isExamplePanelOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsExamplePanelOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExamplePanelOpen]);

  function applyMarkers(markers) {
    if (!monacoRef.current || !editorRef.current) return;
    monacoRef.current.editor.setModelMarkers(
      editorRef.current.getModel(),
      'brahm',
      markers
    );
  }

  function runPipeline(rawValue) {
    if (!rawValue || rawValue.trim() === '') {
      rawConfigRef.current = '';
      setNormalizedConfig(null);
      setPendingConfig(null);
      setValidationErrors([]);
      setMonacoMarkers([]);
      setEngineWarnings([]);
      applyMarkers([]);
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(rawValue);
    } catch (err) {
      setValidationErrors([{ message: 'Invalid JSON: ' + err.message }]);
      setPendingConfig(null);
      setMonacoMarkers([]);
      applyMarkers([]);
      return;
    }

    const { config: normalized, engineWarnings: warns } = normalize(parsed);
    setEngineWarnings(warns);

    const result = validate(normalized, rawValue);
    setValidationErrors(result.errors || []);
    setMonacoMarkers(result.monacoMarkers || []);
    applyMarkers(result.monacoMarkers || []);

    if (result.success) {
      setPendingConfig(result.data);
      setGeneratedBackendCode(null);
      setCurrentLocale(result.data.i18n?.default || 'en');

      apiFetch('/api/projects/' + projectId, {
        method: 'PUT',
        body: JSON.stringify({ config: result.data })
      }).catch(() => { });
    } else {
      setPendingConfig(null);
    }
  }

  function handleEditorMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    if (rawConfigRef.current) {
      editor.setValue(rawConfigRef.current);
      runPipeline(rawConfigRef.current);
    }
  }

  function handleEditorChange(value) {
    if (!value || value.trim() === '') {
      clearTimeout(debounceRef.current);
      rawConfigRef.current = '';
      setNormalizedConfig(null);
      setPendingConfig(null);
      setValidationErrors([]);
      setMonacoMarkers([]);
      setEngineWarnings([]);
      applyMarkers([]);
      return;
    }
    rawConfigRef.current = value;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runPipeline(value);
    }, 300);
  }

  function handleDragStart(e, type) {
    e.dataTransfer.setData('text/plain', JSON.stringify(snippetFor(type)));
  }

  function handleDrop(e) {
    e.preventDefault();
    const text = e.dataTransfer.getData('text/plain');
    if (!text) return;

    try {
      const snippet = JSON.parse(text);
      let currentConfig;
      try {
        currentConfig = JSON.parse(rawConfigRef.current || '{}');
      } catch {
        currentConfig = {};
      }
      if (!Array.isArray(currentConfig.layout)) {
        currentConfig.layout = [];
      }
      currentConfig.layout.push(snippet);
      const newValue = JSON.stringify(currentConfig, null, 2);
      if (editorRef.current) {
        editorRef.current.setValue(newValue);
      }
    } catch {
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleImportApply() {
    setShowImportModal(false);
    if (editorRef.current) {
      editorRef.current.setValue(importText);
    }
    setImportText('');
  }

  function handleSelectExample(example) {
    const jsonStr = JSON.stringify(example.config, null, 2);
    if (editorRef.current) {
      editorRef.current.setValue(jsonStr);
    }
    setIsExamplePanelOpen(false);
  }

  function handleGithubButtonClick() {
    if (!normalizedConfig) {
      window.alert('No valid config loaded. Paste a valid JSON config before pushing to GitHub.');
      return;
    }
    setGithubRepoName(projectName ? projectName.toLowerCase().replace(/\s+/g, '-') : 'brahm-app');
    setGithubIsPrivate(true);
    setGithubPushStatus('idle');
    setGithubPushError(null);
    setGithubRepoUrl(null);
    setGithubPatInput('');
    setGithubPatSaveError(null);
    setIsGithubModalOpen(true);
  }

  async function handleSavePat() {
    if (!githubPatInput.trim()) {
      setGithubPatSaveError('Please enter your GitHub Personal Access Token.');
      return;
    }

    setGithubPatSaving(true);
    setGithubPatSaveError(null);

    try {
      const res = await apiFetch('/api/github/credentials', {
        method: 'POST',
        body: JSON.stringify({ token: githubPatInput.trim() })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setGithubPatSaveError(data.error || 'Failed to save credentials. Please try again.');
        return;
      }

      setGithubCredentials({ githubUsername: data.data.githubUsername, updatedAt: new Date().toISOString() });
      setGithubPatInput('');
    } catch (err) {
      setGithubPatSaveError('Network error: ' + (err.message || 'Could not reach the server.'));
    } finally {
      setGithubPatSaving(false);
    }
  }

  async function handleGithubPush() {
    if (!githubRepoName || !/^[a-zA-Z0-9_.-]+$/.test(githubRepoName)) {
      setGithubPushError('Repository name can only contain letters, numbers, hyphens, underscores, and dots.');
      return;
    }

    setGithubPushStatus('pushing');
    setGithubPushError(null);

    try {
      const generated = generateTemplates(normalizedConfig, projectId);
      const files = {};

      Object.entries(generated.frontend).forEach(([filename, content]) => {
        files['frontend/src/' + filename] = content;
      });
      Object.entries(generated.backend).forEach(([filename, content]) => {
        files['backend/' + filename] = content;
      });
      files['docker-compose.yml'] = DOCKER_COMPOSE_CONTENT;
      files['README.md'] = generateReadme(normalizedConfig, projectName);

      const res = await apiFetch('/api/github/push', {
        method: 'POST',
        body: JSON.stringify({
          repoName: githubRepoName,
          isPrivate: githubIsPrivate,
          files
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401) {
          setGithubCredentials(null);
          setGithubPushError('GitHub token is no longer valid. Please reconnect your account below.');
        } else {
          setGithubPushError(data.error || 'Push failed. Please try again.');
        }
        setGithubPushStatus('error');
        return;
      }

      setGithubRepoUrl(data.data.repoUrl);
      setGithubPushStatus('success');
    } catch (err) {
      setGithubPushError('Network error: ' + (err.message || 'Could not reach the server.'));
      setGithubPushStatus('error');
    }
  }

  async function handleDisconnectGithub() {
    try {
      await apiFetch('/api/github/credentials', { method: 'DELETE' });
      setGithubCredentials(null);
      setGithubPatInput('');
      setGithubPatSaveError(null);
    } catch {
    }
  }

  function handleCsvButtonClick() {
    if (!normalizedConfig || !normalizedConfig.entities || normalizedConfig.entities.length === 0) {
      window.alert('Define at least one entity in your config before importing data.');
      return;
    }
    setCsvSelectedEntity(normalizedConfig.entities[0].name);
    setCsvStep(1);
    setCsvFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setCsvMapping({});
    setCsvError(null);
    setIsCsvModalOpen(true);
  }

  function handleCsvFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    setCsvError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 501,
      complete: (results) => {
        if (results.data.length > 500) {
          setCsvError('CSV exceeds 500 row limit. Please use a smaller file.');
          return;
        }
        if (results.data.length === 0) {
          setCsvError('CSV file is empty.');
          return;
        }
        setCsvData(results.data);
        setCsvHeaders(Object.keys(results.data[0]));
        
        const initialMapping = {};
        const entity = normalizedConfig.entities.find(en => en.name === csvSelectedEntity);
        if (entity) {
          Object.keys(entity.fields).forEach(f => {
            const match = Object.keys(results.data[0]).find(h => h.toLowerCase() === f.toLowerCase());
            if (match) initialMapping[f] = match;
          });
        }
        setCsvMapping(initialMapping);
        setCsvStep(2);
      },
      error: (err) => {
        setCsvError('Failed to parse CSV: ' + err.message);
      }
    });
  }

  async function handleCsvImport() {
    setCsvImporting(true);
    setCsvError(null);

    try {
      const entity = normalizedConfig.entities.find(en => en.name === csvSelectedEntity);
      const mappedData = csvData.map(row => {
        const item = {};
        Object.keys(entity.fields).forEach(f => {
          const csvCol = csvMapping[f];
          if (csvCol) {
            item[f] = row[csvCol];
          }
        });
        return item;
      });

      const res = await apiFetch(`/api/projects/${projectId}/data/${csvSelectedEntity.toLowerCase()}/import`, {
        method: 'POST',
        body: JSON.stringify(mappedData)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Import failed.');
      }

      setIsCsvModalOpen(false);
      if (iframeRef.current?.contentWindow && iframeLoadedRef.current) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'DATA_REFRESH', payload: { entity: csvSelectedEntity.toLowerCase() } },
          '*'
        );
      }
      window.alert(`Successfully imported ${data.count} rows into ${csvSelectedEntity}.`);
    } catch (err) {
      setCsvError(err.message);
    } finally {
      setCsvImporting(false);
    }
  }

  function handleBackToProjects() {
    const currentNormalized = useBuilderStore.getState().normalizedConfig;
    const currentRaw = rawConfigRef.current;

    if (currentNormalized === null && currentRaw && currentRaw.trim() !== '') {
      const confirmed = window.confirm(
        'Your current config has errors and has not been saved. Leave anyway?'
      );
      if (!confirmed) return;
    }

    navigate('/dashboard');
  }

  async function handlePreviewClick() {
    if (!normalizedConfig) return;
    try {
      const res = await apiFetch('/preview', {
        method: 'POST',
        body: JSON.stringify({
          ...normalizedConfig,
          _projectId: projectId,
          _accessToken: localStorage.getItem('brahm_access_token') || ''
        })
      });
      const data = await res.json();
      if (data.success) {
        window.open(`${BASE_URL}/preview/` + data.key, '_blank');
      }
    } catch {
    }
  }

  async function handleSignOut() {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
    localStorage.removeItem('brahm_access_token');
    navigate('/');
  }

  function handleApplyConfig() {
    if (!pendingConfig) return;
    normalizedConfigRef.current = pendingConfig;
    setNormalizedConfig(pendingConfig);
    setPendingConfig(null);
  }

  function getStatusColor() {
    if (pendingConfig) return '#1D9E75';
    if (normalizedConfig && !pendingConfig) return '#4a7ab5';
    if (validationErrors.length > 0 && rawConfigRef.current && rawConfigRef.current.trim() !== '') return '#E24B4A';
    return '#a3a3a3';
  }

  function getStatusText() {
    if (pendingConfig) return 'Valid — click Apply';
    if (normalizedConfig && !pendingConfig) return 'Applied';
    if (validationErrors.length > 0 && rawConfigRef.current && rawConfigRef.current.trim() !== '') return 'Invalid JSON';
    return 'No config';
  }

  function handleTabClick(tab) {
    setActiveTab(tab);
    if ((tab === 'frontend-code' || tab === 'backend-code') && normalizedConfig) {
      if (!generatedFrontendCode && !generatedBackendCode) {
        try {
          const result = generateTemplates(normalizedConfig, projectId);
          setGeneratedFrontendCode(result.frontend || {});
          setGeneratedBackendCode(result.backend || {});
        } catch {
        }
      }
    }
  }

  function renderCodeFiles(files) {
    if (!files || Object.keys(files).length === 0) {
      return <CodeEmpty>No entities defined. Add entities to your config to generate code.</CodeEmpty>;
    }
    return Object.entries(files).map(([filename, code]) => {
      const highlighted = hljs.highlight(code, { language: 'javascript' }).value;
      return (
        <CodeFile key={filename}>
          <CodeFileHeader>{filename}</CodeFileHeader>
          <CodeBlock>
            <code dangerouslySetInnerHTML={{ __html: highlighted }} />
          </CodeBlock>
        </CodeFile>
      );
    });
  }

  const registryKeys = Object.keys(ComponentRegistry);

  return (
    <Shell>
      <Topbar>
        <TopLeft>
          <Wordmark>BRAHM</Wordmark>
          <BetaPill>beta</BetaPill>
          <Breadcrumb>
            <Navlink onClick={handleBackToProjects}>Projects</Navlink>
            {' › ' + projectName}
          </Breadcrumb>
        </TopLeft>
        <TopRight>
          <IconBtn id="theme-toggle" onClick={toggleDarkMode}>
            {isDarkMode ? '☀' : '☽'}
          </IconBtn>
          <GhostBtn id="examples-btn" onClick={() => setIsExamplePanelOpen(true)}>Examples</GhostBtn>
          <GhostBtn id="import-json-btn" onClick={() => setShowImportModal(true)}>Import JSON</GhostBtn>
          <GhostBtn id="preview-btn" onClick={handlePreviewClick}>Preview</GhostBtn>
          <FilledBtn 
            id="github-btn" 
            onClick={handleGithubButtonClick}
            style={{ background: '#1a3a5c', color: '#ffffff', height: '26px', borderRadius: '4px', fontSize: '12px', border: 'none', cursor: 'pointer', padding: '0 12px' }}
          >
            GitHub
          </FilledBtn>
          <GhostBtn id="builder-signout" onClick={handleSignOut}>Sign Out</GhostBtn>
        </TopRight>
      </Topbar>

      <StatusBar>
        <StatusDot $color={getStatusColor()} />
        <StatusText>{getStatusText()}</StatusText>
        {normalizedConfig?.i18n?.locales?.length > 1 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', alignItems: 'center', marginRight: '8px' }}>
            {normalizedConfig.i18n.locales.map(loc => (
              <button
                key={loc}
                onClick={() => setCurrentLocale(loc)}
                style={{
                  fontSize: '11px',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  cursor: 'pointer',
                  border: 'none',
                  background: currentLocale === loc ? '#1a3a5c' : '#e6f1fb',
                  color: currentLocale === loc ? '#ffffff' : '#0c447c'
                }}
              >
                {loc.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        {engineWarnings.length > 0 && (
          <WarningPill>{engineWarnings.length} warning(s)</WarningPill>
        )}
        <div style={{ marginLeft: engineWarnings.length > 0 ? '8px' : 'auto' }}>
          <GhostBtn onClick={handleCsvButtonClick} style={{ height: '20px', padding: '0 8px', fontSize: '10px' }}>Import CSV</GhostBtn>
        </div>
        <FilledBtn
          id="apply-config-btn"
          onClick={handleApplyConfig}
          disabled={!pendingConfig}
          style={{
            marginLeft: '8px',
            height: '26px',
            padding: '0 12px',
            fontSize: '12px',
            borderRadius: '4px',
            opacity: pendingConfig ? 1 : 0.4,
            cursor: pendingConfig ? 'pointer' : 'default',
            pointerEvents: pendingConfig ? 'auto' : 'none'
          }}
        >▶ Apply Config</FilledBtn>
        <StackTag style={{ marginLeft: '8px' }}>React · Node · PostgreSQL</StackTag>
      </StatusBar>

      <MainArea>
        <Sidebar>
          <SectionLabel>COMPONENTS</SectionLabel>
          {PALETTE_ITEMS.map(item => (
            <PaletteItem
              key={item.type}
              draggable
              onDragStart={e => handleDragStart(e, item.type)}
            >
              <IconTile $bg={item.color}>{item.display[0]}</IconTile>
              {item.display}
            </PaletteItem>
          ))}

          <SectionLabel style={{ marginTop: '16px' }}>PAGES</SectionLabel>
          <PageItem>Page 1</PageItem>

          <SectionLabel style={{ marginTop: '16px' }}>REGISTRY</SectionLabel>
          {registryKeys.map(k => (
            <RegistryKey key={k}>{k}</RegistryKey>
          ))}
        </Sidebar>

        <EditorPane>
          <EditorDropZone onDrop={handleDrop} onDragOver={handleDragOver}>
            <Editor
              height="100%"
              language="json"
              theme={isDarkMode ? 'vs-dark' : 'vs'}
              defaultValue=""
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              options={{
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineHeight: 20,
                fontSize: 13,
                minimap: { enabled: false },
                overviewRulerLanes: 0,
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  verticalScrollbarSize: 6,
                  horizontalScrollbarSize: 6
                }
              }}
            />
          </EditorDropZone>
        </EditorPane>

        <RightPane>
          <TabBar>
            <TabBtn $active={activeTab === 'preview'} onClick={() => handleTabClick('preview')}>Preview</TabBtn>
            <TabBtn $active={activeTab === 'frontend-code'} onClick={() => handleTabClick('frontend-code')}>Frontend Code</TabBtn>
            <TabBtn $active={activeTab === 'backend-code'} onClick={() => handleTabClick('backend-code')}>Backend Code</TabBtn>
          </TabBar>
          <div style={{ display: activeTab === 'preview' ? 'flex' : 'none', width: '100%', height: '100%', flexDirection: 'column' }}>
            <PreviewContainer>
              {normalizedConfig ? (
                <PreviewIframe
                  ref={iframeRef}
                  srcDoc={PREVIEW_SRCDOC}
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  title="Brahm Preview"
                  onLoad={() => {
                    iframeLoadedRef.current = true;
                    const config = normalizedConfigRef.current;
                    if (config && iframeRef.current?.contentWindow) {
                      iframeRef.current.contentWindow.postMessage(
                        {
                          type: 'CONFIG_UPDATE',
                          payload: {
                            ...config,
                            _projectId: projectId,
                            _accessToken: localStorage.getItem('brahm_access_token') || ''
                          }
                        },
                        '*'
                      );
                    }
                  }}
                />
              ) : (
                <PreviewEmpty>Enter a valid JSON config to see the preview</PreviewEmpty>
              )}
            </PreviewContainer>
          </div>
          <div style={{ display: activeTab === 'frontend-code' ? 'flex' : 'none', width: '100%', height: '100%', flexDirection: 'column', overflow: 'hidden' }}>
            <CodeContainer className="brahm-code-scroll">
              {normalizedConfig
                ? renderCodeFiles(generatedFrontendCode)
                : <CodeEmpty>No valid config to generate code from.</CodeEmpty>}
            </CodeContainer>
          </div>
          <div style={{ display: activeTab === 'backend-code' ? 'flex' : 'none', width: '100%', height: '100%', flexDirection: 'column', overflow: 'hidden' }}>
            <CodeContainer className="brahm-code-scroll">
              {normalizedConfig
                ? renderCodeFiles(generatedBackendCode)
                : <CodeEmpty>No valid config to generate code from.</CodeEmpty>}
            </CodeContainer>
          </div>
        </RightPane>
      </MainArea>

      {showImportModal && (
        <ModalOverlay onClick={() => setShowImportModal(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Import JSON</ModalTitle>
            <ModalTextarea
              id="import-json-textarea"
              placeholder='Paste your JSON config here...'
              value={importText}
              onChange={e => setImportText(e.target.value)}
            />
            <ModalBtnRow>
              <GhostBtn onClick={() => setShowImportModal(false)}>Cancel</GhostBtn>
              <FilledBtn id="import-json-apply" onClick={handleImportApply}>Apply</FilledBtn>
            </ModalBtnRow>
          </ModalBox>
        </ModalOverlay>
      )}
      {isExamplePanelOpen && (
        <>
          <ExampleBackdrop onClick={() => setIsExamplePanelOpen(false)} />
          <ExamplePanel>
            <ExamplePanelHeader>
              <ExamplePanelTitle>Examples</ExamplePanelTitle>
              <ClosePanelBtn onClick={() => setIsExamplePanelOpen(false)}>✕</ClosePanelBtn>
            </ExamplePanelHeader>
            <ExampleList className="brahm-code-scroll">
              {EXAMPLE_CONFIGS.map(example => (
                <ExampleCard key={example.name} onClick={() => handleSelectExample(example)}>
                  <ExampleName>{example.name}</ExampleName>
                  <ExampleDesc>{example.description}</ExampleDesc>
                  <div>
                    {example.config.entities.map(e => (
                      <EntityPill key={e.name}>{e.name}</EntityPill>
                    ))}
                  </div>
                </ExampleCard>
              ))}
            </ExampleList>
          </ExamplePanel>
        </>
      )}
      {isGithubModalOpen && (
        <ModalOverlay onClick={() => (githubPushStatus !== 'pushing' && !githubPatSaving) && setIsGithubModalOpen(false)}>
          <ModalBox onClick={e => e.stopPropagation()} style={{ width: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '15px', fontWeight: '500', color: '#0a0a0a' }}>Push to GitHub</span>
              <button 
                onClick={() => setIsGithubModalOpen(false)} 
                disabled={githubPushStatus === 'pushing' || githubPatSaving}
                style={{ fontSize: '13px', color: '#6b6b6b', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >✕</button>
            </div>

            <div style={{ borderBottom: '1px solid #e5e5e5', marginBottom: '16px' }}></div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '500', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>GitHub Account</div>
              
              {githubCredLoading ? (
                <div style={{ fontSize: '12px', color: '#a3a3a3' }}>Loading...</div>
              ) : !githubCredentials ? (
                <div>
                  <p style={{ fontSize: '12px', color: '#6b6b6b', lineHeight: '1.5', marginBottom: '10px' }}>
                    Enter your GitHub Personal Access Token. It must have the <strong>repo</strong> scope. You can create one at <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" style={{ color: '#1a3a5c', textDecoration: 'underline' }}>github.com/settings/tokens</a>.
                  </p>
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={githubPatInput}
                    onChange={e => setGithubPatInput(e.target.value)}
                    style={{ width: '100%', height: '32px', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '0 8px', fontSize: '13px', fontFamily: 'monospace' }}
                  />
                  {githubPatSaveError && (
                    <div style={{ fontSize: '12px', color: '#E24B4A', marginTop: '6px' }}>{githubPatSaveError}</div>
                  )}
                  <FilledBtn 
                    onClick={handleSavePat} 
                    disabled={githubPatSaving || githubPatInput.trim().length === 0}
                    style={{ height: '28px', fontSize: '12px', marginTop: '10px', background: '#1a3a5c' }}
                  >
                    {githubPatSaving ? 'Connecting...' : 'Connect'}
                  </FilledBtn>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#f0fdf4', border: '1px solid #1D9E75', borderRadius: '4px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }}></div>
                  <div style={{ fontSize: '12px', color: '#0a0a0a' }}>Connected as <strong>@{githubCredentials.githubUsername}</strong></div>
                  <div 
                    onClick={handleDisconnectGithub}
                    style={{ fontSize: '11px', color: '#E24B4A', cursor: 'pointer', textDecoration: 'underline', marginLeft: 'auto' }}
                  >Disconnect</div>
                </div>
              )}
            </div>

            {githubCredentials && (
              <>
                <div style={{ borderBottom: '1px solid #e5e5e5', marginTop: '16px', marginBottom: '16px' }}></div>
                
                {githubPushStatus === 'success' ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1D9E75', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto 16px auto' }}>✓</div>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: '#0a0a0a', textAlign: 'center', marginBottom: '8px' }}>Repository created successfully!</p>
                    <a 
                      onClick={() => window.open(githubRepoUrl, '_blank')}
                      style={{ fontSize: '12px', color: '#1a3a5c', textDecoration: 'underline', cursor: 'pointer', display: 'block', textAlign: 'center', marginTop: '6px' }}
                    >{githubRepoUrl}</a>
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                      <GhostBtn onClick={() => setIsGithubModalOpen(false)}>Close</GhostBtn>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '500', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Repository Settings</div>
                    
                    <label style={{ fontSize: '12px', color: '#6b6b6b', display: 'block', marginBottom: '4px' }}>Repository Name</label>
                    <input
                      type="text"
                      value={githubRepoName}
                      onChange={e => setGithubRepoName(e.target.value)}
                      placeholder="my-brahm-app"
                      style={{ width: '100%', height: '32px', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '0 8px', fontSize: '13px' }}
                    />

                    <div style={{ marginTop: '12px' }}>
                      <label style={{ fontSize: '12px', color: '#6b6b6b', display: 'block', marginBottom: '4px' }}>Visibility</label>
                      <select
                        value={githubIsPrivate ? 'private' : 'public'}
                        onChange={e => setGithubIsPrivate(e.target.value === 'private')}
                        style={{ width: '100%', height: '32px', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '0 8px', fontSize: '13px', background: '#ffffff' }}
                      >
                        <option value="private">Private — only you can see this repository</option>
                        <option value="public">Public — anyone on GitHub can see this repository</option>
                      </select>
                    </div>

                    <p style={{ fontSize: '11px', color: '#a3a3a3', marginTop: '10px' }}>
                      Creates a new repository named <strong>{githubRepoName}</strong> and pushes your generated frontend and backend files.
                    </p>

                    {githubPushError && (
                      <div style={{ background: '#fef2f2', border: '1px solid #E24B4A', borderRadius: '4px', padding: '8px 12px', fontSize: '12px', color: '#E24B4A', marginTop: '12px' }}>
                        {githubPushError}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
                      <GhostBtn onClick={() => setIsGithubModalOpen(false)} disabled={githubPushStatus === 'pushing'}>Cancel</GhostBtn>
                      <FilledBtn 
                        onClick={handleGithubPush} 
                        disabled={githubPushStatus === 'pushing' || githubRepoName.trim().length === 0}
                        style={{ background: '#1a3a5c' }}
                      >
                        {githubPushStatus === 'pushing' ? 'Pushing...' : 'Push to GitHub'}
                      </FilledBtn>
                    </div>
                  </div>
                )}
              </>
            )}
          </ModalBox>
        </ModalOverlay>
      )}
      {isCsvModalOpen && (
        <ModalOverlay onClick={() => !csvImporting && setIsCsvModalOpen(false)}>
          <ModalBox onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '15px', fontWeight: '500', color: '#0a0a0a' }}>Import CSV Data</span>
              <button onClick={() => setIsCsvModalOpen(false)} disabled={csvImporting} style={{ fontSize: '13px', color: '#6b6b6b', border: 'none', background: 'transparent', cursor: 'pointer' }}>✕</button>
            </div>

            {csvStep === 1 && (
              <>
                <label style={{ fontSize: '12px', color: '#6b6b6b', display: 'block', marginBottom: '8px' }}>Select Entity</label>
                <select
                  value={csvSelectedEntity}
                  onChange={e => setCsvSelectedEntity(e.target.value)}
                  style={{ width: '100%', height: '32px', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '0 8px', fontSize: '13px', marginBottom: '16px', background: '#ffffff' }}
                >
                  {(normalizedConfig.entities || []).map(en => (
                    <option key={en.name} value={en.name}>{en.name}</option>
                  ))}
                </select>

                <div style={{ border: '2px dashed #e5e5e5', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    style={{ display: 'none' }}
                    id="csv-file-input"
                  />
                  <label htmlFor="csv-file-input" style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a3a5c' }}>Click to upload CSV</div>
                    <div style={{ fontSize: '11px', color: '#6b6b6b', marginTop: '4px' }}>Max 500 rows</div>
                  </label>
                </div>
              </>
            )}

            {csvStep === 2 && (
              <>
                <div style={{ background: '#f9f9f9', borderRadius: '4px', padding: '12px', marginBottom: '16px', border: '1px solid #e5e5e5' }}>
                  <div style={{ fontSize: '11px', color: '#6b6b6b', textTransform: 'uppercase', marginBottom: '8px' }}>Map Columns for {csvSelectedEntity}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.keys(normalizedConfig.entities.find(en => en.name === csvSelectedEntity).fields).map(field => (
                      <div key={field} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, fontSize: '12px', fontWeight: '500' }}>{field}</div>
                        <select
                          value={csvMapping[field] || ''}
                          onChange={e => setCsvMapping(prev => ({ ...prev, [field]: e.target.value }))}
                          style={{ flex: 1.5, height: '28px', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '0 4px', fontSize: '12px', background: '#ffffff' }}
                        >
                          <option value="">(Skip field)</option>
                          {csvHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#6b6b6b', marginBottom: '8px' }}>Data Preview (Top 3 rows)</div>
                <div style={{ maxHeight: '120px', overflow: 'auto', border: '1px solid #e5e5e5', borderRadius: '4px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ background: '#f4f4f4' }}>
                        {csvHeaders.map(h => <th key={h} style={{ padding: '4px 8px', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 3).map((row, i) => (
                        <tr key={i}>
                          {csvHeaders.map(h => <td key={h} style={{ padding: '4px 8px', borderBottom: '1px solid #f4f4f4' }}>{row[h]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <GhostBtn onClick={() => setCsvStep(1)}>Back</GhostBtn>
                  <FilledBtn onClick={handleCsvImport} disabled={csvImporting} style={{ background: '#1a3a5c' }}>
                    {csvImporting ? 'Importing...' : `Import ${csvData.length} Rows`}
                  </FilledBtn>
                </div>
              </>
            )}

            {csvError && (
              <div style={{ background: '#fef2f2', border: '1px solid #E24B4A', borderRadius: '4px', padding: '8px 12px', fontSize: '12px', color: '#E24B4A', marginTop: '12px' }}>
                {csvError}
              </div>
            )}
          </ModalBox>
        </ModalOverlay>
      )}
    </Shell>
  );
} 
