import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JsonField } from '../types';

interface ScoreSheetPreviewProps {
  fields: JsonField[];
  show: boolean;
}

export const ScoreSheetPreview: React.FC<ScoreSheetPreviewProps> = ({ fields, show }) => {
  if (!show || fields.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Sheet Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-muted-foreground/20 p-6 bg-background">
          <div className="space-y-6">
            {fields.map(field => {
              if (field.type === 'section_header') {
                return (
                  <div key={field.id} className="border-b-2 border-primary pb-2">
                    <h3 className="text-lg font-bold text-primary">{field.name}</h3>
                  </div>
                );
              }
              
              if (field.type === 'scoring_scale') {
                return (
                  <div key={field.id} className="grid grid-cols-5 gap-2 items-center py-2 border-b">
                    <div className="font-medium">{field.name}</div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Poor</div>
                      <div className="text-sm">{field.scaleRanges?.poor.min}-{field.scaleRanges?.poor.max}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Average</div>
                      <div className="text-sm">{field.scaleRanges?.average.min}-{field.scaleRanges?.average.max}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Exceptional</div>
                      <div className="text-sm">{field.scaleRanges?.exceptional.min}-{field.scaleRanges?.exceptional.max}</div>
                    </div>
                    <div className="text-center font-medium">
                      {field.pointValue} pts
                    </div>
                  </div>
                );
              }
              
              if (field.type === 'penalty_checkbox') {
                return (
                  <div key={field.id} className="flex items-center justify-between py-1 border-b border-dashed">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" disabled className="w-4 h-4" />
                      <span className="text-sm">{field.name}</span>
                    </div>
                    <span className="text-sm text-destructive">-{field.penaltyValue} pts</span>
                  </div>
                );
              }
              
              return (
                <div key={field.id} className="flex items-center justify-between py-2 border-b">
                  <span className="font-medium">{field.name}</span>
                  <div className="flex items-center gap-2">
                    <input className="border rounded px-2 py-1 w-32" disabled />
                    {field.pointValue && <span className="text-sm">{field.pointValue} pts</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};