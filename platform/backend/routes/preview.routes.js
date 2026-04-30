const router = require('express').Router();
const { nanoid } = require('nanoid');
const authMiddleware = require('../middlewares/auth.middleware');

const previewStore = new Map();

function buildPreviewHtml(config) {
  const tokens = (config && config.theme && config.theme.tokens) || {
    primary: '#1a3a5c', background: '#ffffff', surface: '#f9f9f9', divider: '#e5e5e5',
    textPrimary: '#0a0a0a', textSecondary: '#6b6b6b', success: '#1D9E75', warning: '#D97706',
    error: '#E24B4A', radius: '4px', spacing: '8px'
  };
  const layout = (config && config.layout) || [];
  const configJson = JSON.stringify(config || {}).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  const tokensJson = JSON.stringify(tokens).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  return `<!DOCTYPE html>
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

(function() {
  var config = ${configJson};
  bootstrapApp(config);
})();
</script>
</body>
</html>`;
}

router.post('/', authMiddleware, (req, res) => {
  const config = req.body;
  if (!config || typeof config !== 'object') {
    return res.status(400).json({ success: false, error: 'Config object is required' });
  }
  const key = nanoid(12);
  previewStore.set(key, config);
  setTimeout(() => previewStore.delete(key), 30 * 60 * 1000);
  res.json({ success: true, key });
});

router.get('/:key', (req, res) => {
  const config = previewStore.get(req.params.key);
  if (!config) {
    return res.status(404).send('<p>Preview expired or not found.</p>');
  }
  const html = buildPreviewHtml(config);
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline';"
  );
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

module.exports = router;
