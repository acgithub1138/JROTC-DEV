export interface JsonField {
  id: string;
  name: string;
  type: 'text' | 'dropdown' | 'number' | 'section_header' | 'calculated' | 'label' | 'bold_gray' | 'pause' | 'penalty' | 'penalty_checkbox' | 'scoring_scale'; // 'pause' for backward compatibility
  fieldInfo?: string; // Information text displayed under the field
  textType?: 'short' | 'notes'; // For text fields
  values?: string[];
  maxValue?: number; // For number fields
  penalty: boolean; // Keep for backward compatibility
  pauseField: boolean; // For pause field formatting
  penaltyValue?: number; // Specific penalty amount
  // Penalty-specific fields
  penaltyType?: 'points' | 'minor_major';
  pointValue?: number; // For points-based penalties
  // Scoring scale specific
  scaleRanges?: {
    poor: { min: number; max: number };
    average: { min: number; max: number };
    exceptional: { min: number; max: number };
  };
  // Section specific
  sectionId?: string;
  // Calculated field specific
  calculationType?: 'sum' | 'subtotal';
  calculationFields?: string[];
}

export interface JsonFieldBuilderProps {
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
}