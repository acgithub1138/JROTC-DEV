// Module-specific permission mappings - defines which actions are relevant for each module
export const modulePermissionMappings = {
  'budget': [
    'view', 'create', 'read', 'update', 'delete', 'sidebar'
  ],
  'users': [
    'view', 'create', 'read', 'update', 'delete', 'sidebar',
    'activate_deactivate', 'reset_password', 'bulk_import'
  ],
  'tasks': [
    'view', 'create', 'read', 'update', 'delete', 'sidebar',
    'assign'
  ],
  'events': [
    'view', 'create', 'read', 'update', 'delete', 'sidebar',
    'assign'
  ],
  'competitions': [
    'view', 'create', 'read', 'update', 'delete', 'sidebar'
  ],
  'contacts': [
    'view', 'create', 'read', 'update', 'delete', 'sidebar'
  ],
  'email': [
    'view', 'create', 'read', 'update', 'delete', 'sidebar',
    'reset_password'
  ],
  'incidents': [
    'view', 'create', 'read', 'update', 'delete', 'sidebar',
    'assign'
  ],
  'inventory': [
    'view', 'create', 'read', 'update', 'delete', 'sidebar',
    'bulk_import'
  ],
  'job_board': [
    'view', 'create', 'read', 'update', 'delete', 'sidebar'
  ],
  'teams': [
    'view', 'create', 'read', 'update', 'delete', 'sidebar',
    'assign'
  ]
};

export const isPermissionRelevantForModule = (moduleName: string, actionName: string): boolean => {
  const relevantActions = modulePermissionMappings[moduleName as keyof typeof modulePermissionMappings];
  return relevantActions ? relevantActions.includes(actionName) : false;
};