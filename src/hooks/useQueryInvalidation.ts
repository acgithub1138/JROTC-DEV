import { useQueryClient } from '@tanstack/react-query';

/**
 * Centralized query invalidation strategies
 * Provides granular invalidation methods to prevent unnecessary refetches
 */
export const useQueryInvalidation = () => {
  const queryClient = useQueryClient();

  /**
   * Invalidate a specific task and its related data
   */
  const invalidateTask = (taskId: string, schoolId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['tasks', schoolId] });
    queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] });
    queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
  };

  /**
   * Invalidate tasks and dashboard stats together
   */
  const invalidateTasksAndDashboard = (schoolId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['tasks', schoolId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats', schoolId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-activity', schoolId] });
  };

  /**
   * Invalidate budget transactions and dashboard stats
   */
  const invalidateBudgetAndDashboard = (schoolId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['budget-transactions', schoolId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats', schoolId] });
  };

  /**
   * Invalidate inventory and dashboard stats
   */
  const invalidateInventoryAndDashboard = (schoolId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['inventory-items', schoolId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats', schoolId] });
  };

  /**
   * Invalidate competition events for a specific competition
   */
  const invalidateCompetitionEvents = (competitionId: string, schoolId?: string) => {
    queryClient.invalidateQueries({ 
      queryKey: ['competition-events', competitionId, schoolId] 
    });
  };

  /**
   * Invalidate all competition-related data for a competition
   */
  const invalidateCompetitionData = (competitionId: string, schoolId?: string) => {
    queryClient.invalidateQueries({ 
      queryKey: ['competition-events', competitionId, schoolId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['event-registrations', competitionId, schoolId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['cp-comp-schools', competitionId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['cp-event-schedules', competitionId] 
    });
  };

  /**
   * Invalidate profile cache when profiles are updated
   */
  const invalidateProfiles = (schoolId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['profile-cache', schoolId] });
    queryClient.invalidateQueries({ queryKey: ['school-users', schoolId] });
  };

  /**
   * Invalidate incidents and dashboard stats
   */
  const invalidateIncidentsAndDashboard = (schoolId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['incidents', schoolId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats', schoolId] });
  };

  return {
    invalidateTask,
    invalidateTasksAndDashboard,
    invalidateBudgetAndDashboard,
    invalidateInventoryAndDashboard,
    invalidateCompetitionEvents,
    invalidateCompetitionData,
    invalidateProfiles,
    invalidateIncidentsAndDashboard,
  };
};
