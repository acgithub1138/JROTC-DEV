import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { JsonField } from '../json-field-builder/types';

interface ScoreFieldRendererProps {
  field: JsonField;
  value: any;
  onChange: (fieldId: string, value: any) => void;
}

export const ScoreFieldRenderer: React.FC<ScoreFieldRendererProps> = ({ field, value, onChange }) => {
  const renderField = () => {
    switch (field.type) {
      case 'section_header':
        return (
          <div className="border-b-2 border-primary pb-2">
            <h3 className="text-lg font-bold text-primary">
              {field.name}
            </h3>
          </div>
        );

      case 'label':
      case 'bold_gray':
      case 'pause':
        return (
          <div className="py-2">
            {field.pauseField ? (
              <div className="bg-muted px-3 py-2 rounded">
                <span className="font-bold">{field.name}</span>
              </div>
            ) : (
              <span className="font-medium">{field.name}</span>
            )}
            {field.fieldInfo && (
              <p className="text-sm text-muted-foreground mt-2">{field.fieldInfo}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div className="border-b space-y-2 py-[4px]">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor={field.id} 
                className={field.pauseField ? "font-bold bg-muted px-3 py-2 rounded" : "font-medium"}
              >
                {field.name}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={field.id}
                  type="number"
                  min="0"
                  max={field.maxValue}
                  value={value || ''}
                  onChange={e => onChange(field.id, e.target.value)}
                  placeholder={`Max: ${field.maxValue || 'N/A'}`}
                  className="w-32"
                />
              </div>
            </div>
            {field.fieldInfo && (
              <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>
            )}
          </div>
        );

      case 'dropdown':
        return (
          <div className="py-2 border-b space-y-2">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor={field.id} 
                className={field.pauseField ? "font-bold bg-muted px-3 py-2 rounded" : "font-medium"}
              >
                {field.name}
              </Label>
              <div className="flex items-center gap-2">
                <Select value={value || ''} onValueChange={val => onChange(field.id, val)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {field.values?.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {field.fieldInfo && (
              <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="py-2 border-b space-y-2">
            <div className="flex items-center justify-between">
              <Label 
                htmlFor={field.id} 
                className={field.pauseField ? "font-bold bg-muted px-3 py-2 rounded" : "font-medium"}
              >
                {field.name}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={field.id}
                  type="text"
                  value={value || ''}
                  onChange={e => onChange(field.id, e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
            {field.fieldInfo && (
              <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>
            )}
          </div>
        );

      case 'penalty':
        return (
          <div className="border-b space-y-2 py-[4px]">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.id} className="font-medium text-destructive">
                {field.name}
              </Label>
              <div className="flex items-center gap-2">
                {field.penaltyType === 'points' ? (
                  <Input
                    id={field.id}
                    type="number"
                    min="0"
                    value={value || ''}
                    onChange={e => onChange(field.id, e.target.value)}
                    placeholder="Violations"
                    className="w-32"
                  />
                ) : field.penaltyType === 'minor_major' ? (
                  <Select value={value || ''} onValueChange={val => onChange(field.id, val)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor (-20)</SelectItem>
                      <SelectItem value="major">Major (-50)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.id}
                    type="number"
                    value={value || ''}
                    onChange={e => onChange(field.id, e.target.value)}
                    className="w-32"
                  />
                )}
              </div>
            </div>
            {field.fieldInfo && (
              <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>
            )}
            {field.penaltyType === 'points' && field.pointValue && (
              <p className="text-xs text-destructive">Each violation: {field.pointValue} points</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return <div key={field.id}>{renderField()}</div>;
};