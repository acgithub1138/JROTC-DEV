
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SubjectFieldProps {
  value: string;
  onChange: (value: string) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const SubjectField: React.FC<SubjectFieldProps> = ({
  value,
  onChange,
  inputRef,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="subject">Email Subject</Label>
      <Input
        id="subject"
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter email subject (use {{variable}} for dynamic content)"
        required
      />
    </div>
  );
};
