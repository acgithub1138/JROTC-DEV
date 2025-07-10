// Module-specific permission mappings - defines which actions are relevant for each module
export const modulePermissionMappings = {
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
  'incidents': [
    'view', 'create', 'read', 'update', 'delete', 'sidebar'
  ],
  'job_board': [
    'view', 'create', 'read', 'update', 'delete', 'sidebar'
  ],
  'inventory': [
    'view', 'create', 'read', 'update', 'delete', 'sidebar',
    'assign'
  ],
  'dashboard': [
    'view', 'sidebar', 'view_analytics'
  ],
  'budget': [
    'view', 'create', 'read', 'update', 'delete', 'sidebar'
  ]
};

export const isPermissionRelevantForModule = (moduleName: string, actionName: string): boolean => {
  const relevantActions = modulePermissionMappings[moduleName as keyof typeof modulePermissionMappings];
  return relevantActions ? relevantActions.includes(actionName) : false;
};