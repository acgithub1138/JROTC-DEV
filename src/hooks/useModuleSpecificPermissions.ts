import React, { useMemo } from 'react';
import { usePermissionContext } from '@/contexts/PermissionContext';

// Helper hook for module permissions
const useModulePermissions = (module: string) => {
  const { hasPermission } = usePermissionContext();
  
  // Memoize all permission checks to prevent excessive calls
  return useMemo(() => ({
    canAccess: hasPermission(module, 'sidebar'),
    canRead: hasPermission(module, 'read'),
    canViewDetails: hasPermission(module, 'view'),
    canCreate: hasPermission(module, 'create'),
    canUpdate: hasPermission(module, 'update'),
    canDelete: hasPermission(module, 'delete'),
  }), [hasPermission, module]);
};

// Task-specific permissions with memoization
export const useTaskPermissions = () => {
  const modulePermissions = useModulePermissions('tasks');
  const { hasPermission } = usePermissionContext();
  
  // Memoize additional task-specific permissions
  const additionalPermissions = useMemo(() => ({
    canAssign: hasPermission('tasks', 'assign'),
    canManageOptions: hasPermission('tasks', 'manage_options'),
    canUpdateAssigned: hasPermission('tasks', 'update_assigned'),
  }), [hasPermission]);
  
  return useMemo(() => ({
    ...modulePermissions,
    canView: modulePermissions.canViewDetails,
    ...additionalPermissions,
  }), [modulePermissions, additionalPermissions]);
};

// User management specific permissions
export const useUserPermissions = () => {
  const modulePermissions = useModulePermissions('users');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canResetPassword: hasPermission('users', 'reset_password'),
    canBulkImport: hasPermission('users', 'bulk_import'),
  };
};

// Cadet management specific permissions
export const useCadetPermissions = () => {
  const modulePermissions = useModulePermissions('cadets');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canResetPassword: hasPermission('cadets', 'reset_password'),
    canBulkImport: hasPermission('cadets', 'bulk_import'),
    canSidebar: hasPermission('cadets', 'sidebar'),
  };
};

// Event-specific permissions
export const useEventPermissions = () => {
  const modulePermissions = useModulePermissions('calendar');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canAssign: hasPermission('calendar', 'assign'),
  };
};

// Competition-specific permissions
export const useCompetitionPermissions = () => {
  const modulePermissions = useModulePermissions('competitions');
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
  };
};

// Competition Portal-specific permissions
export const useCPCompetitionPermissions = () => {
  const { hasPermission } = usePermissionContext();
  const modulePermissions = useModulePermissions('cp_competitions');
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canViewDetails: hasPermission('cp_competitions', 'view'),
    canEdit: hasPermission('cp_competitions', 'update'),
    canDelete: hasPermission('cp_competitions', 'delete'),
    canManage: hasPermission('cp_competitions', 'manage'),
  };
};


// Job Board specific permissions - memoized
export const useJobBoardPermissions = () => {
  const modulePermissions = useModulePermissions('job_board');
  const { hasPermission } = usePermissionContext();
  
  return useMemo(() => ({
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canAssign: hasPermission('job_board', 'assign'),
    canManageHierarchy: hasPermission('job_board', 'manage_hierarchy'),
  }), [modulePermissions, hasPermission]);
};

// Inventory-specific permissions - use optimized version
export const useInventoryPermissions = () => {
  const modulePermissions = useModulePermissions('inventory');
  const { hasPermission, isLoading } = usePermissionContext();
  
  const permissions = {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canAssign: hasPermission('inventory', 'assign'),
    canBulkImport: hasPermission('inventory', 'bulk_import'),
  };

  return permissions;
};

// Dashboard-specific permissions
export const useDashboardPermissions = () => {
  const modulePermissions = useModulePermissions('dashboard');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canViewAnalytics: hasPermission('dashboard', 'view_analytics'),
    
    // Widget permissions
    canViewStatsCadets: hasPermission('dashboard', 'view_stats_cadets'),
    canViewStatsTasks: hasPermission('dashboard', 'view_stats_tasks'),
    canViewStatsBudget: hasPermission('dashboard', 'view_stats_budget'),
    canViewStatsInventory: hasPermission('dashboard', 'view_stats_inventory'),
    canViewStatsIncidents: hasPermission('dashboard', 'view_stats_incidents'),
    canViewStatsCommunityService: hasPermission('dashboard', 'view_stats_community_service'),
    canViewStatsSchools: hasPermission('dashboard', 'view_stats_schools'),
    canViewMyTasks: hasPermission('dashboard', 'view_my_tasks'),
    canViewMyCadets: hasPermission('dashboard', 'view_my_cadets'),
    canViewUpcomingEvents: hasPermission('dashboard', 'view_upcoming_events'),
    canViewQuickActions: hasPermission('dashboard', 'view_quick_actions'),
    canViewAnnouncements: hasPermission('dashboard', 'view_announcements_widget'),
    canViewMobileFeatures: hasPermission('dashboard', 'view_mobile_features'),
    canViewSharedPictures: hasPermission('dashboard', 'view_shared_pictures'),
  };
};

// Incident-specific permissions
export const useIncidentPermissions = () => {
  const modulePermissions = useModulePermissions('incident_management');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canViewDetails,
    canAssign: hasPermission('incident_management', 'assign'),
    canUpdateAssigned: hasPermission('incident_management', 'update_assigned'),
  };
};

// Calendar-specific permissions
export const useCalendarPermissions = () => {
  const modulePermissions = useModulePermissions('calendar');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canViewDetails: hasPermission('calendar', 'view'),
  };
};

// Email Management specific permissions
export const useEmailPermissions = () => {
  const modulePermissions = useModulePermissions('email');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canManageTemplates: hasPermission('email', 'manage_templates'),
    canManageRules: hasPermission('email', 'manage_rules'),
    canProcessQueue: hasPermission('email', 'process_queue'),
  };
};

export const useCompetitionSchedulePermissions = () => {
  const permissions = useModulePermissions('cp_schedules');

  return {
    canView: permissions.canAccess,
    canManageSchedule: permissions.canUpdate && permissions.canCreate && permissions.canDelete,
    ...permissions
  };
};

// Competition Events specific permissions
export const useCompetitionEventsPermissions = () => {
  const { hasPermission } = usePermissionContext();
  const modulePermissions = useModulePermissions('cp_comp_events');
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canViewDetails: hasPermission('cp_comp_events', 'view'),
    canEdit: hasPermission('cp_comp_events', 'update'),
    canDelete: hasPermission('cp_comp_events', 'delete'),
    canCreate: hasPermission('cp_comp_events', 'create'),
  };
};

// Competition Resources specific permissions
export const useCompetitionResourcesPermissions = () => {
  const modulePermissions = useModulePermissions('cp_comp_resources');
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
  };
};

// Competition Schools specific permissions
export const useCompetitionSchoolsPermissions = () => {
  const modulePermissions = useModulePermissions('cp_comp_schools');
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
  };
};

// Competition Results specific permissions
export const useCompetitionResultsPermissions = () => {
  const modulePermissions = useModulePermissions('cp_comp_results');
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
  };
};

// Competition Judges specific permissions
export const useCompetitionJudgesPermissions = () => {
  const modulePermissions = useModulePermissions('cp_comp_judges');
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
  };
};

// Open Competitions specific permissions
export const useOpenCompetitionsPermissions = () => {
  const modulePermissions = useModulePermissions('open_competitions');
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
  };
};

// Open Competitions - Open tab permissions
export const useOpenCompsOpenPermissions = () => {
  const modulePermissions = useModulePermissions('open_comps_open');
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
  };
};

// Open Competitions - Registered tab permissions
export const useOpenCompsRegisteredPermissions = () => {
  const modulePermissions = useModulePermissions('open_comps_registered');
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
  };
};

// Open Competitions - Schedule tab permissions
export const useOpenCompsSchedulePermissions = () => {
  const modulePermissions = useModulePermissions('open_comps_schedule');
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
  };
};

// My Competitions specific permissions
export const useMyCompetitionsPermissions = () => {
  const modulePermissions = useModulePermissions('my_competitions');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canViewDetails: hasPermission('my_competitions', 'view'),
    canUpdate: hasPermission('my_competitions', 'update'),
    canDelete: hasPermission('my_competitions', 'delete'),
    canCreate: hasPermission('my_competitions', 'create'),
  };
};

// My Competitions Reports specific permissions
export const useMyCompetitionsReportsPermissions = () => {
  const modulePermissions = useModulePermissions('my_competitions_reports');
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
  };
};

// CP Judges specific permissions
export const useCPJudgesPermissions = () => {
  const modulePermissions = useModulePermissions('cp_judges');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canViewDetails: hasPermission('cp_judges', 'view'),
    canEdit: hasPermission('cp_judges', 'update'),
    canDelete: hasPermission('cp_judges', 'delete'),
    canCreate: hasPermission('cp_judges', 'create'),
  };
};

// CP Score Sheets specific permissions
export const useCPScoreSheetsPermissions = () => {
  const modulePermissions = useModulePermissions('cp_score_sheets');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canViewDetails: hasPermission('cp_score_sheets', 'view'),
    canEdit: hasPermission('cp_score_sheets', 'update'),
    canDelete: hasPermission('cp_score_sheets', 'delete'),
    canCreate: hasPermission('cp_score_sheets', 'create'),
    canUpdate: hasPermission('cp_score_sheets', 'update'), // alias for consistency
  };
};

// Announcements specific permissions
export const useAnnouncementPermissions = () => {
  const modulePermissions = useModulePermissions('announcements');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canViewDetails: hasPermission('announcements', 'view'),
    canEdit: hasPermission('announcements', 'update'),
    canDelete: hasPermission('announcements', 'delete'),
    canCreate: hasPermission('announcements', 'create'),
    canUpdate: hasPermission('announcements', 'update'), // alias for consistency
  };
};

// PT Test specific permissions
export const usePTTestPermissions = () => {
  const modulePermissions = useModulePermissions('pt_test');
  const { hasPermission } = usePermissionContext();
  
  return {
    ...modulePermissions,
    canView: modulePermissions.canRead,
    canViewDetails: hasPermission('pt_test', 'view'),
    canEdit: hasPermission('pt_test', 'edit'),
    canDelete: hasPermission('pt_test', 'delete'),
    canCreate: hasPermission('pt_test', 'create'),
    canUpdate: hasPermission('pt_test', 'update'), // alias for consistency
  };
};