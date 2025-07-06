import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { JsonField } from '../components/json-field-builder/types';

interface EventScoreFormProps {
  templateScores: Record<string, any>;
  onScoreChange: (scores: Record<string, any>, totalPoints: number) => void;
  initialScores?: Record<string, any>;
}

export const EventScoreForm: React.FC<EventScoreFormProps> = ({
  templateScores,
  onScoreChange,
  initialScores = {}
}) => {
  const [scores, setScores] = useState<Record<string, any>>(initialScores);
  const [totalPoints, setTotalPoints] = useState(0);

  // Parse template fields from the JSON structure
  const fields: JsonField[] = templateScores.fields || [];

  const calculateTotal = (currentScores: Record<string, any>) => {
    let total = 0;
    
    fields.forEach(field => {
      const fieldValue = currentScores[field.id];
      
      if (field.type === 'number' && fieldValue) {
        total += Number(fieldValue) || 0;
      }
      
      if (field.type === 'scoring_scale' && fieldValue) {
        // For scoring scales, use the entered score
        total += Number(fieldValue) || 0;
      }
      
      if (field.type === 'penalty_checkbox' && fieldValue === true) {
        // Subtract penalty value
        total -= field.penaltyValue || 0;
      }
    });
    
    return Math.max(0, total); // Ensure total doesn't go below 0
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    const newScores = { ...scores, [fieldId]: value };
    setScores(newScores);
    
    const newTotal = calculateTotal(newScores);
    setTotalPoints(newTotal);
    onScoreChange(newScores, newTotal);
  };

  const renderField = (field: JsonField) => {
    const fieldValue = scores[field.id];

    switch (field.type) {
      case 'section_header':
        return (
          <div key={field.id} className="col-span-2">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2 mb-4">
              {field.name}
            </h3>
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.name}</Label>
            <Input
              id={field.id}
              type="number"
              min="0"
              max={field.maxValue}
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={`Max: ${field.maxValue || 'N/A'}`}
            />
            {field.pointValue && (
              <p className="text-sm text-muted-foreground">Point value: {field.pointValue}</p>
            )}
          </div>
        );

      case 'scoring_scale':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.name}</Label>
            <Input
              id={field.id}
              type="number"
              min="0"
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
            {field.scaleRanges && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Poor: {field.scaleRanges.poor.min}-{field.scaleRanges.poor.max}</p>
                <p>Average: {field.scaleRanges.average.min}-{field.scaleRanges.average.max}</p>
                <p>Exceptional: {field.scaleRanges.exceptional.min}-{field.scaleRanges.exceptional.max}</p>
              </div>
            )}
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.name}</Label>
            <Select value={fieldValue || ''} onValueChange={(value) => handleFieldChange(field.id, value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {field.values?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'penalty_checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={fieldValue === true}
                onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
              />
              <Label htmlFor={field.id} className="text-destructive">
                {field.name}
              </Label>
            </div>
            {field.penaltyValue && (
              <p className="text-sm text-muted-foreground">
                Penalty: -{field.penaltyValue} points
              </p>
            )}
          </div>
        );

      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.name}</Label>
            <Input
              id={field.id}
              type="text"
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    const initialTotal = calculateTotal(initialScores);
    setTotalPoints(initialTotal);
    onScoreChange(initialScores, initialTotal);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(renderField)}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Total Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {totalPoints} points
          </div>
        </CardContent>
      </Card>
    </div>
  );
};