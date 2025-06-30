
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { VariableButton } from './VariableButton';

interface RelatedField {
  column_name: string;
  display_label: string;
  data_type: string;
}

interface ExpandableVariableButtonProps {
  label: string;
  variableName: string;
  dataType: string;
  relatedFields?: RelatedField[];
  onClick: (variableName: string) => void;
  className?: string;
}

export const ExpandableVariableButton: React.FC<ExpandableVariableButtonProps> = ({
  label,
  variableName,
  dataType,
  relatedFields = [],
  onClick,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasRelatedFields = relatedFields.length > 0;
  const isUuidField = dataType === 'uuid' && hasRelatedFields;

  const handleMainClick = () => {
    if (isUuidField) {
      setIsExpanded(!isExpanded);
    } else {
      onClick(variableName);
    }
  };

  return (
    <div className="w-full">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleMainClick}
        className={`w-full justify-start text-xs ${className}`}
      >
        {isUuidField && (
          isExpanded ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />
        )}
        {label}
      </Button>
      
      {isExpanded && isUuidField && (
        <div className="ml-4 mt-1 space-y-1">
          {relatedFields.map((field) => (
            <VariableButton
              key={field.column_name}
              label={field.display_label}
              variableName={`${variableName}.${field.column_name}`}
              dataType={field.data_type}
              onClick={onClick}
              size="sm"
              className="text-xs"
            />
          ))}
        </div>
      )}
    </div>
  );
};
