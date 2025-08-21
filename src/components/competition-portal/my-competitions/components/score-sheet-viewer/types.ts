export interface CompetitionEvent {
  id: string;
  event: string;
  score_sheet: any;
  total_points: number;
  cadet_ids: string[];
  team_name?: string;
  school_id: string; // School that submitted the score sheet
  competition_id?: string; // Internal competition id when applicable
  source_competition_id?: string; // Portal/source competition id when applicable
  source_type?: string;
  created_at: string;
  updated_at: string;
  competition_event_types?: {
    name: string;
  };
  profiles?: Array<{
    id: string;
    first_name: string;
    last_name: string;
  }>;
}
