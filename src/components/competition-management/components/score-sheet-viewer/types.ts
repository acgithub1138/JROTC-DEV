export interface CompetitionEvent {
  id: string;
  event: string;
  score_sheet: any;
  total_points: number;
  cadet_ids: string[];
  team_name?: string;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
  }[];
}

export interface ViewScoreSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competition: any;
}