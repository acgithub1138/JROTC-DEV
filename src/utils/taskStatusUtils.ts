import { TaskStatusOption, TaskPriorityOption } from '@/hooks/useTaskOptions';

/**
 * Utility functions for task status management
 * Provides dynamic status checking based on database configuration
 */

// Cache for status options to avoid repeated lookups
let cachedStatusOptions: TaskStatusOption[] = [];
let cachedPriorityOptions: TaskPriorityOption[] = [];

export const setCachedStatusOptions = (options: TaskStatusOption[]) => {
  cachedStatusOptions = options;
};

export const setCachedPriorityOptions = (options: TaskPriorityOption[]) => {
  cachedPriorityOptions = options;
};

/**
 * Get all statuses that indicate task completion
 */
export const getCompletionStatuses = (statusOptions?: TaskStatusOption[]): string[] => {
  const options = statusOptions || cachedStatusOptions;
  // Look for statuses that commonly indicate completion
  const completionPatterns = ['done', 'complete', 'finished', 'resolved', 'closed'];
  
  return options
    .filter(option => 
      option.is_active && 
      completionPatterns.some(pattern => 
        option.value.toLowerCase().includes(pattern) || 
        option.label.toLowerCase().includes(pattern)
      )
    )
    .map(option => option.value);
};

/**
 * Get all statuses that indicate task cancellation
 */
export const getCancelStatuses = (statusOptions?: TaskStatusOption[]): string[] => {
  const options = statusOptions || cachedStatusOptions;
  // Look for statuses that commonly indicate cancellation
  const cancelPatterns = ['cancel', 'cancelled', 'canceled', 'abort', 'rejected'];
  
  return options
    .filter(option => 
      option.is_active && 
      cancelPatterns.some(pattern => 
        option.value.toLowerCase().includes(pattern) || 
        option.label.toLowerCase().includes(pattern)
      )
    )
    .map(option => option.value);
};

/**
 * Check if a status indicates completion
 */
export const isCompletionStatus = (status: string, statusOptions?: TaskStatusOption[]): boolean => {
  const completionStatuses = getCompletionStatuses(statusOptions);
  return completionStatuses.includes(status);
};

/**
 * Check if a status indicates cancellation
 */
export const isCancelStatus = (status: string, statusOptions?: TaskStatusOption[]): boolean => {
  const cancelStatuses = getCancelStatuses(statusOptions);
  return cancelStatuses.includes(status);
};

/**
 * Check if a task is considered done (completed or canceled)
 */
export const isTaskDone = (status: string, statusOptions?: TaskStatusOption[]): boolean => {
  return isCompletionStatus(status, statusOptions) || isCancelStatus(status, statusOptions);
};

/**
 * Get the color class for a status
 */
export const getStatusColorClass = (status: string, statusOptions?: TaskStatusOption[]): string => {
  const options = statusOptions || cachedStatusOptions;
  const statusOption = options.find(option => option.value === status);
  return statusOption?.color_class || 'bg-gray-100 text-gray-800';
};

/**
 * Get the color class for a priority
 */
export const getPriorityColorClass = (priority: string, priorityOptions?: TaskPriorityOption[]): string => {
  const options = priorityOptions || cachedPriorityOptions;
  const priorityOption = options.find(option => option.value === priority);
  return priorityOption?.color_class || 'bg-gray-100 text-gray-800';
};

/**
 * Get the label for a status
 */
export const getStatusLabel = (status: string, statusOptions?: TaskStatusOption[]): string => {
  const options = statusOptions || cachedStatusOptions;
  const statusOption = options.find(option => option.value === status);
  return statusOption?.label || status.replace('_', ' ');
};

/**
 * Get the label for a priority
 */
export const getPriorityLabel = (priority: string, priorityOptions?: TaskPriorityOption[]): string => {
  const options = priorityOptions || cachedPriorityOptions;
  const priorityOption = options.find(option => option.value === priority);
  return priorityOption?.label || priority.charAt(0).toUpperCase() + priority.slice(1);
};

/**
 * Get the default completion status (first status that indicates completion)
 */
export const getDefaultCompletionStatus = (statusOptions?: TaskStatusOption[]): string => {
  const completionStatuses = getCompletionStatuses(statusOptions);
  return completionStatuses[0] || 'done'; // fallback to 'done'
};

/**
 * Get the default cancellation status (first status that indicates cancellation)
 */
export const getDefaultCancelStatus = (statusOptions?: TaskStatusOption[]): string => {
  const cancelStatuses = getCancelStatuses(statusOptions);
  return cancelStatuses[0] || 'canceled'; // fallback to 'canceled'
};