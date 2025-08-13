export interface ScoreField {
  id: string;
  name?: string;
  criteria?: string;
  title?: string;
  type: string;
  max_score?: number;
  maxScore?: number;
  points?: number;
  textType?: string;
  pauseField?: boolean;
  penaltyType?: string;
  options?: string[];
  [key: string]: any;
}

export interface ProcessedScoreField {
  id: string;
  name: string;
  type: string;
  max_score: number;
  textType?: string;
  pauseField?: boolean;
  penaltyType?: string;
  options?: string[];
}

export interface ScoreValues {
  [fieldId: string]: any;
}

export interface ScoreSheetData {
  template_id?: string;
  template_name?: string;
  judge_number?: string | number;
  scores: ScoreValues;
  calculated_at?: string;
}

export interface ScoreSheetItem {
  id: string;
  criteria: string;
  max_score: number;
  score: any;
  type?: string;
  pauseField?: boolean;
}

export interface Template {
  id?: string;
  template_name?: string;
  scores?: any;
  criteria?: any[];
  [key: string]: any;
}