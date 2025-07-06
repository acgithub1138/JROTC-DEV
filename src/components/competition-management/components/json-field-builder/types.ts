export interface JsonField {
  id: string;
  name: string;
  type: 'text' | 'dropdown' | 'number' | 'section_header' | 'calculated';
  fieldInfo?: string; // Information text displayed under the field
  textType?: 'short' | 'notes'; // For text fields
  values?: string[];
  maxValue?: number; // For number fields
  penalty: boolean;
  penaltyValue?: number; // Specific penalty amount
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