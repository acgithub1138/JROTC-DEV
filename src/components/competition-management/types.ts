export interface Competition {
  id: string;
  school_id: string;
  name: string;
  description?: string;
  location?: string;
  competition_date: string;
  registration_deadline?: string;
  type: 'drill' | 'marksmanship' | 'academic' | 'leadership' | 'physical_fitness' | 'inspection';
  teams?: string[];
  cadets?: string[];
  overall_placement?: CompetitionPlacement;
  overall_armed_placement?: CompetitionPlacement;
  overall_unarmed_placement?: CompetitionPlacement;
  armed_regulation?: CompetitionPlacement;
  armed_exhibition?: CompetitionPlacement;
  armed_color_guard?: CompetitionPlacement;
  armed_inspection?: CompetitionPlacement;
  unarmed_regulation?: CompetitionPlacement;
  unarmed_exhibition?: CompetitionPlacement;
  unarmed_color_guard?: CompetitionPlacement;
  unarmed_inspection?: CompetitionPlacement;
  created_at: string;
  updated_at: string;
}

export interface CompetitionTemplate {
  id: string;
  template_name: string;
  event: CompetitionEventType;
  jrotc_program: 'air_force' | 'army' | 'coast_guard' | 'navy' | 'marine_corps' | 'space_force';
  scores: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CompetitionEvent {
  id: string;
  school_id: string;
  competition_id: string;
  event: CompetitionEventType;
  cadet_id: string;
  total_points: number;
  score_sheet: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type CompetitionEventType = 
  | 'Armed Inspection'
  | 'Armed Color Guard'
  | 'Armed Exhibition'
  | 'Armed Dual Exhibition'
  | 'Armed Regulation'
  | 'Armed Solo Exhibition'
  | 'Unarmed Inspection'
  | 'Unarmed Color Guard'
  | 'Unarmed Exhibition'
  | 'Unarmed Dual Exhibition'
  | 'Unarmed Regulation';

export type CompetitionPlacement = 
  | 'NA'
  | '1st'
  | '2nd'
  | '3rd'
  | '4th'
  | '5th'
  | '6th'
  | '7th'
  | '8th'
  | '9th'
  | '10th';

export interface CompetitionFilters {
  search: string;
  type: string;
  startDate?: string;
  endDate?: string;
}