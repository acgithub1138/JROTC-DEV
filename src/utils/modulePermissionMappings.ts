// Module-specific permission mappings - defines which actions are relevant for each module
export const modulePermissionMappings = {
  'budget': [
    'sidebar', 'read', 'create', 'view', 'update', 'delete'
  ],
  'cadets': [
    'sidebar', 'read', 'create', 'view', 'update', 'delete',
    'bulk_import', 'reset_password'
  ],
  'tasks': [
    'sidebar', 'read', 'create', 'view', 'update', 'delete',
    'assign', 'update_assigned'
  ],
  'calendar': [
    'sidebar', 'read', 'create', 'view', 'update', 'delete'
  ],
  'competitions': [
    'sidebar', 'read', 'create', 'view', 'update', 'delete'
  ],
  'contacts': [
    'sidebar', 'read', 'create', 'view', 'update', 'delete'
  ],
  'email': [
    'sidebar', 'read', 'create', 'view', 'update', 'delete'
  ],
  'incidents': [
    'sidebar', 'read', 'create', 'view', 'update', 'delete',
    'assign', 'update_assigned'
  ],
  'users': [
    'sidebar', 'read', 'create', 'view', 'update', 'delete',
    'bulk_import', 'reset_password'
  ],
  'inventory': [
    'sidebar', 'read', 'create', 'view', 'update', 'delete',
    'bulk_import'
  ],
  'job_board': [
    'sidebar', 'read', 'create', 'view', 'update', 'delete'
  ],
  'teams': [
    'sidebar', 'read', 'create', 'view', 'update', 'delete'
  ]
};

export const isPermissionRelevantForModule = (moduleName: string, actionName: string): boolean => {
  const relevantActions = modulePermissionMappings[moduleName as keyof typeof modulePermissionMappings];
  return relevantActions ? relevantActions.includes(actionName) : false;
};