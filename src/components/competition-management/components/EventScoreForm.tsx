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

  // Parse template fields from the JSON structure - templates use 'criteria' not 'fields'
  const rawFields = templateScores?.criteria || [];
  
  // Convert template criteria to JsonField format and ensure each field has an ID
  const fields: JsonField[] = rawFields.map((field: any, index: number) => ({
    ...field,
    id: field.id || `field_${index}_${field.name?.replace(/\s+/g, '_').toLowerCase()}`,
    // Convert penalty boolean to penaltyValue for scoring
    penaltyValue: field.penalty && field.penaltyValue ? field.penaltyValue : (field.penalty ? 5 : 0)
  }));

  console.log('Template scores:', templateScores);
  console.log('Raw criteria:', rawFields);
  console.log('Processed fields:', fields);

  const calculateTotal = (currentScores: Record<string, any>) => {
    let total = 0;
    
    fields.forEach(field => {
      const fieldValue = currentScores[field.id];
      
      if (field.type === 'number' && fieldValue) {
        total += Number(fieldValue) || 0;
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
          <div key={field.id} className="border-b-2 border-primary pb-2">
            <h3 className="text-lg font-bold text-primary">
              {field.name}
            </h3>
          </div>
        );


      case 'label':
        return (
          <div key={field.id} className="py-2">
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
          <div key={field.id} className="py-2 border-b space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.id} className={field.pauseField ? "font-bold bg-muted px-3 py-2 rounded" : "font-medium"}>
                {field.name}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={field.id}
                  type="number"
                  min="0"
                  max={field.maxValue}
                  value={fieldValue || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
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
          <div key={field.id} className="py-2 border-b space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.id} className={field.pauseField ? "font-bold bg-muted px-3 py-2 rounded" : "font-medium"}>
                {field.name}
              </Label>
              <div className="flex items-center gap-2">
                <Select value={fieldValue || ''} onValueChange={(value) => handleFieldChange(field.id, value)}>
                  <SelectTrigger className="w-32">
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
            </div>
            {field.fieldInfo && (
              <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>
            )}
          </div>
        );

      case 'text':
        return (
          <div key={field.id} className="py-2 border-b space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.id} className={field.pauseField ? "font-bold bg-muted px-3 py-2 rounded" : "font-medium"}>
                {field.name}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={field.id}
                  type="text"
                  value={fieldValue || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
            {field.fieldInfo && (
              <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>
            )}
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

  if (!templateScores || !fields || fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No scoring fields found in this template.</p>
        <p className="text-sm mt-2">Please check the template configuration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
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