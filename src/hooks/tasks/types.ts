
// Dynamic types that adapt to database records
export type TaskStatus = string; // Now dynamic based on database
export type TaskPriority = string; // Now dynamic based on database

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  assigned_by: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  school_id: string;
  team_id: string | null;
  task_number: string | null;
  assigned_to_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  assigned_by_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  subtasks?: Subtask[];
  attachments?: Array<{
    id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    created_at: string;
  }>;
}

export interface Subtask {
  id: string;
  parent_task_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  assigned_by: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  school_id: string;
  team_id: string | null;
  task_number: string | null;
  assigned_to_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  assigned_by_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  attachments?: Array<{
    id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    created_at: string;
  }>;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment_text: string;
  is_system_comment: boolean;
  created_at: string;
  user_profile: {
    first_name: string;
    last_name: string;
  };
}

export interface CreateTaskData {
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string | null;
  due_date?: string | null;
  team_id?: string | null;
}

export interface CreateSubtaskData {
  parent_task_id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string | null;
  due_date?: string | null;
  team_id?: string | null;
}

// Option interfaces for dynamic options
export interface TaskStatusOption {
  id: string;
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
  is_active: boolean;
}

export interface TaskPriorityOption {
  id: string;
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
  is_active: boolean;
}
