export interface CompetitionEvent {
  id: string;
  event: string;
  score_sheet: {
    scores: Record<string, any>;
    judge_number?: string;
    template_id?: string;
    template_name?: string;
    calculated_at?: string;
  };
  total_points: number;
  cadet_ids: string[];
  team_name?: string;
  created_at: string;
  updated_at: string;
  profiles?: Array<{
    id: string;
    first_name: string;
    last_name: string;
  }>;
}