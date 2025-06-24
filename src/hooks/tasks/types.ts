
import { TaskStatus, TaskPriority } from '@/config/taskOptions';

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
