
import { Task } from '@/hooks/useTasks';

// Helper function to check if a task is active (not completed/canceled)
export const isTaskActive = (task: Task): boolean => {
  const completedStatuses = ['done', 'completed', 'canceled'];
  return !completedStatuses.includes(task.status.toLowerCase());
};

// Get active tasks assigned to current user
export const getMyActiveTasks = (tasks: Task[], userId: string | undefined): Task[] => {
  if (!userId) return [];
  return tasks.filter(task => 
    task.assigned_to === userId && isTaskActive(task)
  );
};

// Get all tasks from school (regardless of status)
export const getAllSchoolTasks = (tasks: Task[]): Task[] => {
  return tasks; // Already filtered by school_id in the query
};

// Get completed/canceled tasks
export const getCompletedTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task => !isTaskActive(task));
};
