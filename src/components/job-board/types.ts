
export interface JobBoard {
  id: string;
  cadet_id: string;
  role: string;
  reports_to?: string;
  assistant?: string;
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
  };
}

export interface NewJobBoard {
  cadet_id: string;
  role: string;
  reports_to?: string;
  assistant?: string;
}
