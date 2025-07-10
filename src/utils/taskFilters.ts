
import { Task } from '@/hooks/useTasks';
import { Subtask } from '@/hooks/tasks/types';

// Helper function to check if a task is active (not completed/canceled)
export const isTaskActive = (task: Task | Subtask): boolean => {
  const completedStatuses = ['done', 'completed', 'canceled'];
  return !completedStatuses.includes(task.status.toLowerCase());
};

// Helper function to check if a subtask is active
export const isSubtaskActive = (subtask: Subtask): boolean => {
  return isTaskActive(subtask);
};

// Get active tasks assigned to current user
export const getMyActiveTasks = (tasks: Task[], userId: string | undefined): Task[] => {
  if (!userId) return [];
  return tasks.filter(task => 
    task.assigned_to === userId && isTaskActive(task)
  );
};

// Get active subtasks assigned to current user
export const getMyActiveSubtasks = (subtasks: Subtask[], userId: string | undefined): Subtask[] => {
  if (!userId) return [];
  return subtasks.filter(subtask => 
    subtask.assigned_to === userId && isSubtaskActive(subtask)
  );
};

// Combine tasks and subtasks into a unified list for "My Tasks"
export const getMyActiveTasksAndSubtasks = (
  tasks: Task[], 
  subtasks: Subtask[], 
  userId: string | undefined
): (Task | Subtask)[] => {
  const myTasks = getMyActiveTasks(tasks, userId);
  const mySubtasks = getMyActiveSubtasks(subtasks, userId);
  
  // Combine and sort by created_at (newest first)
  return [...myTasks, ...mySubtasks].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
