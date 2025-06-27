
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BusinessRule } from '@/hooks/useBusinessRules';

interface RuleBuilderHeaderProps {
  rule?: BusinessRule | null;
  onCancel: () => void;
}

export const RuleBuilderHeader: React.FC<RuleBuilderHeaderProps> = ({
  rule,
  onCancel
}) => {
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" onClick={onCancel} className="flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Rules
      </Button>
      <h1 className="text-3xl font-bold">
        {rule ? 'Edit Rule' : 'Create New Rule'}
      </h1>
    </div>
  );
};
