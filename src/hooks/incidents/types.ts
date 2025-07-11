export interface Incident {
  id: string;
  incident_number?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category: string;
  school_id: string;
  created_by?: string;
  assigned_to_admin?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentComment {
  id: string;
  incident_id: string;
  user_id: string;
  comment_text: string;
  is_system_comment: boolean;
  created_at: string;
}

export interface IncidentStatusOption {
  id: string;
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
  is_active: boolean;
}

export interface IncidentPriorityOption {
  id: string;
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
  is_active: boolean;
}

export interface IncidentCategoryOption {
  id: string;
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
  is_active: boolean;
}

export interface CreateIncidentData {
  title: string;
  description?: string;
  priority: string;
  category?: string;
  school_id: string;
  created_by?: string;
  assigned_to_admin?: string;
  due_date?: string;
}

export interface UpdateIncidentData {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  category?: string;
  assigned_to_admin?: string;
  due_date?: string;
  completed_at?: string;
}