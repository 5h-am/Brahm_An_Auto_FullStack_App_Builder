export const EXAMPLE_CONFIGS = [
  {
    name: 'Task Manager',
    description: 'A simple to-do app with title, priority, and completion status.',
    config: {
      version: 1,
      theme: { tokens: { primary: '#1a3a5c' } },
      i18n: {
        locales: ['en', 'es'],
        default: 'en',
        translations: {
          en: {
            appTitle: 'Task Manager',
            addTask: 'Add Task',
            titleLabel: 'Title',
            priorityLabel: 'Priority',
            completedLabel: 'Completed'
          },
          es: {
            appTitle: 'Gestor de Tareas',
            addTask: 'Agregar Tarea',
            titleLabel: 'Título',
            priorityLabel: 'Prioridad',
            completedLabel: 'Completado'
          }
        }
      },
      entities: [
        { name: 'Task', fields: { title: 'string', priority: 'number', completed: 'boolean' } }
      ],
      layout: [
        { type: 'header', props: { title: 't:appTitle' } },
        {
          type: 'form',
          props: { fields: ['title', 'priority', 'completed'], submitText: 't:addTask' },
          actions: { onSubmit: 'createTask' }
        },
        { type: 'table', props: { columns: ['title', 'priority', 'completed'], sortable: true } }
      ]
    }
  },
  {
    name: 'Note Taker',
    description: 'Capture notes with a title and body text.',
    config: {
      version: 1,
      theme: { tokens: { primary: '#2d6a4f' } },
      i18n: {
        locales: ['en', 'es'],
        default: 'en',
        translations: {
          en: {
            appTitle: 'Note Taker',
            saveNote: 'Save Note',
            titleLabel: 'Title',
            bodyLabel: 'Body'
          },
          es: {
            appTitle: 'Bloc de Notas',
            saveNote: 'Guardar Nota',
            titleLabel: 'Título',
            bodyLabel: 'Cuerpo'
          }
        }
      },
      entities: [
        { name: 'Note', fields: { title: 'string', body: 'string' } }
      ],
      layout: [
        { type: 'header', props: { title: 't:appTitle' } },
        {
          type: 'form',
          props: { fields: ['title', 'body'], submitText: 't:saveNote' },
          actions: { onSubmit: 'createNote' }
        },
        { type: 'table', props: { columns: ['title', 'body'], sortable: false } }
      ]
    }
  },
  {
    name: 'Bug Tracker',
    description: 'Track bugs with a title, severity level, and resolved flag.',
    config: {
      version: 1,
      theme: { tokens: { primary: '#7f1d1d' } },
      i18n: {
        locales: ['en', 'es'],
        default: 'en',
        translations: {
          en: {
            appTitle: 'Bug Tracker',
            reportBug: 'Report Bug',
            titleLabel: 'Title',
            severityLabel: 'Severity',
            resolvedLabel: 'Resolved'
          },
          es: {
            appTitle: 'Rastreador de Errores',
            reportBug: 'Reportar Error',
            titleLabel: 'Título',
            severityLabel: 'Severidad',
            resolvedLabel: 'Resuelto'
          }
        }
      },
      entities: [
        { name: 'Bug', fields: { title: 'string', severity: 'number', resolved: 'boolean' } }
      ],
      layout: [
        { type: 'header', props: { title: 't:appTitle' } },
        {
          type: 'form',
          props: { fields: ['title', 'severity', 'resolved'], submitText: 't:reportBug' },
          actions: { onSubmit: 'createBug' }
        },
        { type: 'table', props: { columns: ['title', 'severity', 'resolved'], sortable: true } }
      ]
    }
  },
  {
    name: 'Expense Log',
    description: 'Log expenses with a description, amount, and approval status.',
    config: {
      version: 1,
      theme: { tokens: { primary: '#78350f' } },
      i18n: {
        locales: ['en', 'es'],
        default: 'en',
        translations: {
          en: {
            appTitle: 'Expense Log',
            addExpense: 'Add Expense',
            descriptionLabel: 'Description',
            amountLabel: 'Amount',
            approvedLabel: 'Approved'
          },
          es: {
            appTitle: 'Registro de Gastos',
            addExpense: 'Agregar Gasto',
            descriptionLabel: 'Descripción',
            amountLabel: 'Monto',
            approvedLabel: 'Aprobado'
          }
        }
      },
      entities: [
        { name: 'Expense', fields: { description: 'string', amount: 'number', approved: 'boolean' } }
      ],
      layout: [
        { type: 'header', props: { title: 't:appTitle' } },
        {
          type: 'form',
          props: { fields: ['description', 'amount', 'approved'], submitText: 't:addExpense' },
          actions: { onSubmit: 'createExpense' }
        },
        { type: 'table', props: { columns: ['description', 'amount', 'approved'], sortable: true } }
      ]
    }
  },
  {
    name: 'Inventory Tracker',
    description: 'Manage stock items with a name, quantity, and in-stock flag.',
    config: {
      version: 1,
      theme: { tokens: { primary: '#1e3a5f' } },
      i18n: {
        locales: ['en', 'es'],
        default: 'en',
        translations: {
          en: {
            appTitle: 'Inventory Tracker',
            addItem: 'Add Item',
            nameLabel: 'Name',
            quantityLabel: 'Quantity',
            inStockLabel: 'In Stock'
          },
          es: {
            appTitle: 'Control de Inventario',
            addItem: 'Agregar Artículo',
            nameLabel: 'Nombre',
            quantityLabel: 'Cantidad',
            inStockLabel: 'En Stock'
          }
        }
      },
      entities: [
        { name: 'Item', fields: { name: 'string', quantity: 'number', inStock: 'boolean' } }
      ],
      layout: [
        { type: 'header', props: { title: 't:appTitle' } },
        {
          type: 'form',
          props: { fields: ['name', 'quantity', 'inStock'], submitText: 't:addItem' },
          actions: { onSubmit: 'createItem' }
        },
        { type: 'table', props: { columns: ['name', 'quantity', 'inStock'], sortable: true } }
      ]
    }
  }
];
