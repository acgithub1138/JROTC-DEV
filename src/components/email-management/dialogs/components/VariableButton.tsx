
import React from 'react';
import { Button } from '@/components/ui/button';

interface VariableButtonProps {
  label: string;
  variableName: string;
  dataType?: string;
  isProfileReference?: boolean;
  onClick: (variableName: string) => void;
  size?: 'sm' | 'default';
  className?: string;
}

export const VariableButton: React.FC<VariableButtonProps> = ({
  label,
  variableName,
  dataType,
  isProfileReference = false,
  onClick,
  size = 'sm',
  className = '',
}) => {
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={() => onClick(variableName)}
      className={`w-full justify-start text-xs ${
        isProfileReference ? 'bg-blue-50 border-blue-200' : ''
      } ${className}`}
    >
      {label}
    </Button>
  );
};
