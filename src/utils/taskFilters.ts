
import { Task } from '@/hooks/useTasks';
import { Subtask } from '@/hooks/tasks/types';

// Helper function to check if a task is active (not completed)
export const isTaskActive = (task: Task | Subtask): boolean => {
  return !task.completed_at; // If completed_at is null, task is active
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

// Get all active tasks from school (tasks without completed_at)
export const getAllSchoolTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task => !task.completed_at); // Only show tasks that are not completed
};

// Get all active tasks and subtasks from school (both tasks and subtasks without user filtering)
export const getAllSchoolTasksAndSubtasks = (
  tasks: Task[], 
  subtasks: Subtask[]
): (Task | Subtask)[] => {
  const activeTasks = getAllSchoolTasks(tasks);
  const activeTaskIds = new Set(activeTasks.map(task => task.id));
  
  // Only include subtasks whose parent tasks are NOT active (completed/closed)
  const orphanedSubtasks = subtasks.filter(subtask => 
    !subtask.completed_at && !activeTaskIds.has(subtask.parent_task_id)
  );
  
  // Combine and sort by created_at (newest first)
  return [...activeTasks, ...orphanedSubtasks].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

// Get completed tasks (tasks with completed_at set)
export const getCompletedTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task => !!task.completed_at);
};
