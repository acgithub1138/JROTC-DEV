
// Centralized configuration for task status and priority options
// This is the single source of truth for all task-related enums and options

export interface TaskOptionConfig {
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
}

// Status options configuration - matches database enum values exactly
export const TASK_STATUS_CONFIG: Record<string, TaskOptionConfig> = {
  not_started: {
    value: 'not_started',
    label: 'Not Started',
    color_class: 'bg-gray-100 text-gray-800',
    sort_order: 1
  },
  working_on_it: {
    value: 'working_on_it',
    label: 'Working On It',
    color_class: 'bg-blue-100 text-blue-800',
    sort_order: 2
  },
  stuck: {
    value: 'stuck',
    label: 'Stuck',
    color_class: 'bg-yellow-100 text-yellow-800',
    sort_order: 3
  },
  done: {
    value: 'done',
    label: 'Done',
    color_class: 'bg-green-100 text-green-800',
    sort_order: 4
  },
  pending: {
    value: 'pending',
    label: 'Pending',
    color_class: 'bg-yellow-100 text-yellow-800',
    sort_order: 5
  },
  in_progress: {
    value: 'in_progress',
    label: 'In Progress',
    color_class: 'bg-blue-100 text-blue-800',
    sort_order: 6
  },
  completed: {
    value: 'completed',
    label: 'Completed',
    color_class: 'bg-green-100 text-green-800',
    sort_order: 7
  },
  overdue: {
    value: 'overdue',
    label: 'Overdue',
    color_class: 'bg-red-100 text-red-800',
    sort_order: 8
  },
  canceled: {
    value: 'canceled',
    label: 'Canceled',
    color_class: 'bg-gray-100 text-gray-800',
    sort_order: 9
  }
};

// Priority options configuration - matches database enum values exactly
export const TASK_PRIORITY_CONFIG: Record<string, TaskOptionConfig> = {
  low: {
    value: 'low',
    label: 'Low',
    color_class: 'bg-green-100 text-green-800',
    sort_order: 1
  },
  medium: {
    value: 'medium',
    label: 'Medium',
    color_class: 'bg-yellow-100 text-yellow-800',
    sort_order: 2
  },
  high: {
    value: 'high',
    label: 'High',
    color_class: 'bg-orange-100 text-orange-800',
    sort_order: 3
  },
  urgent: {
    value: 'urgent',
    label: 'Urgent',
    color_class: 'bg-red-100 text-red-800',
    sort_order: 4
  },
  critical: {
    value: 'critical',
    label: 'Critical',
    color_class: 'bg-red-200 text-red-900',
    sort_order: 5
  }
};

// Type-safe enums derived from configuration
export type TaskStatus = keyof typeof TASK_STATUS_CONFIG;
export type TaskPriority = keyof typeof TASK_PRIORITY_CONFIG;

// Helper functions to get arrays of values
export const getTaskStatusValues = (): TaskStatus[] => 
  Object.keys(TASK_STATUS_CONFIG) as TaskStatus[];

export const getTaskPriorityValues = (): TaskPriority[] => 
  Object.keys(TASK_PRIORITY_CONFIG) as TaskPriority[];

// Helper functions to get configuration
export const getStatusConfig = (status: TaskStatus): TaskOptionConfig => 
  TASK_STATUS_CONFIG[status];

export const getPriorityConfig = (priority: TaskPriority): TaskOptionConfig => 
  TASK_PRIORITY_CONFIG[priority];

// Helper functions for database sync
export const getStatusOptionsForDatabase = () => 
  Object.values(TASK_STATUS_CONFIG);

export const getPriorityOptionsForDatabase = () => 
  Object.values(TASK_PRIORITY_CONFIG);
