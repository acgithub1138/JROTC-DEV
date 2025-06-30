
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface BodyFieldProps {
  value: string;
  onChange: (value: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

export const BodyField: React.FC<BodyFieldProps> = ({
  value,
  onChange,
  textareaRef,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="body">Email Body</Label>
      <Textarea
        id="body"
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter email body (use {{variable}} for dynamic content)"
        rows={12}
        required
      />
    </div>
  );
};
