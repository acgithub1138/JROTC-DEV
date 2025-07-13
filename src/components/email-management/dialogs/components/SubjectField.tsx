import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SubjectFieldProps {
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const SubjectField: React.FC<SubjectFieldProps> = ({
  value,
  onChange,
  inputRef,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="subject">Subject</Label>
      <Input
        ref={inputRef}
        id="subject"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter email subject"
        required
      />
    </div>
  );
};