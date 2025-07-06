import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Trash2 } from 'lucide-react';
import { JsonField } from '../types';

interface FieldListProps {
  fields: JsonField[];
  onEditField: (field: JsonField) => void;
  onRemoveField: (id: string) => void;
}

export const FieldList: React.FC<FieldListProps> = ({ fields, onEditField, onRemoveField }) => {
  if (fields.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Added Fields ({fields.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {fields.map(field => (
            <div key={field.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex-1">
                <span className="font-medium">{field.name}</span>
                <div className="text-sm text-muted-foreground">
                  <span>({field.type.replace('_', ' ')}</span>
                  {field.type === 'text' && `, ${field.textType === 'notes' ? '2500' : '75'} chars`}
                  {field.type === 'number' && `, max: ${field.maxValue}`}
                  {field.type === 'scoring_scale' && field.scaleRanges && 
                    `, ${field.scaleRanges.poor.min}-${field.scaleRanges.poor.max}/${field.scaleRanges.average.min}-${field.scaleRanges.average.max}/${field.scaleRanges.exceptional.min}-${field.scaleRanges.exceptional.max}`
                  }
                  {field.type === 'penalty_checkbox' && `, -${field.penaltyValue} pts`}
                  {field.pointValue && `, ${field.pointValue} pts`}
                  {field.penalty && ', penalty'}
                  {field.values && `, ${field.values.length} options`})
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => onEditField(field)}>
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onRemoveField(field.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};