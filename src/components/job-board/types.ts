
export interface Connection {
  id: string;
  type: 'reports_to' | 'assistant';
  target_role: string;
  source_handle: string;
  target_handle: string;
}

export interface JobBoard {
  id: string;
  cadet_id: string;
  role: string;
  email_address?: string;
  reports_to?: string;
  assistant?: string;
  tier?: string;
  connections?: Connection[];
  school_id: string;
  created_at: string;
  updated_at: string;
}

export interface JobBoardWithCadet extends JobBoard {
  cadet: {
    id: string;
    first_name: string;
    last_name: string;
    rank?: string;
    grade?: string;
  } | null;
}

export interface NewJobBoard {
  cadet_id: string;
  role: string;
  email_address?: string;
  reports_to?: string;
  assistant?: string;
  tier?: string;
  connections?: Connection[];
}
