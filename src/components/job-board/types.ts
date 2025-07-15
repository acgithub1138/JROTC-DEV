
export interface JobBoard {
  id: string;
  cadet_id: string;
  role: string;
  reports_to?: string;
  assistant?: string;
  reports_to_source_handle?: string;
  reports_to_target_handle?: string;
  assistant_source_handle?: string;
  assistant_target_handle?: string;
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
  reports_to?: string;
  assistant?: string;
  reports_to_source_handle?: string;
  reports_to_target_handle?: string;
  assistant_source_handle?: string;
  assistant_target_handle?: string;
}
