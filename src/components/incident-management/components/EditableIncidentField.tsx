import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X } from 'lucide-react';

interface EditableIncidentFieldProps {
  label: string;
  value: string;
  type?: 'text' | 'textarea' | 'select';
  options?: Array<{ value: string; label: string }>;
  canEdit?: boolean;
  onSave: (newValue: string) => void;
  multiline?: boolean;
}

export const EditableIncidentField: React.FC<EditableIncidentFieldProps> = ({
  label,
  value,
  type = 'text',
  options = [],
  canEdit = false,
  onSave,
  multiline = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onSave(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (!canEdit) {
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className={multiline ? "whitespace-pre-wrap text-sm" : "text-sm"}>
          {value || 'Not set'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-6 w-6 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          {type === 'textarea' ? (
            <Textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              rows={3}
            />
          ) : type === 'select' ? (
            <Select value={tempValue} onValueChange={setTempValue}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
            />
          )}
          
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className={multiline ? "whitespace-pre-wrap text-sm" : "text-sm"}>
          {value || 'Not set'}
        </div>
      )}
    </div>
  );
};