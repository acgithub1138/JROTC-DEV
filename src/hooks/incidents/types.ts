// Incident types adapted from task types
export type IncidentStatus = string;
export type IncidentPriority = string;
export type IncidentCategory = 'technical' | 'behavioral' | 'safety' | 'other';

export interface Incident {
  id: string;
  incident_number: string | null;
  title: string;
  description: string | null;
  status: IncidentStatus;
  priority: IncidentPriority;
  category: IncidentCategory;
  submitted_by: string | null;
  assigned_to: string | null;
  school_id: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  submitted_by_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  assigned_to_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export interface IncidentComment {
  id: string;
  incident_id: string;
  user_id: string;
  comment_text: string;
  is_system_comment: boolean;
  created_at: string;
  user_name: string | null;
}

export interface CreateIncidentData {
  title: string;
  description?: string | null;
  status: IncidentStatus;
  priority: IncidentPriority;
  category: IncidentCategory;
  assigned_to?: string | null;
}