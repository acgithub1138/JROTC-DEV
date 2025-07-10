import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X } from 'lucide-react';

interface EditableTitleCellProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const EditableTitleCell: React.FC<EditableTitleCellProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave();
          if (e.key === 'Escape') onCancel();
        }}
        className="h-8"
        autoFocus
      />
      <Button size="sm" variant="ghost" onClick={onSave}>
        <Check className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};