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
              
              
              if (field.type === 'label') {
                return (
                  <div key={field.id} className="py-2">
                    <span className="font-medium">{field.name}</span>
                    {field.fieldInfo && (
                      <p className="text-sm text-muted-foreground mt-2">{field.fieldInfo}</p>
                    )}
                  </div>
                );
              }
              
              return (
                <div key={field.id} className="py-2 border-b space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={field.pauseField ? "font-bold bg-muted px-3 py-2 rounded" : "font-medium"}>
                        {field.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <input className="border rounded px-2 py-1 w-32" disabled />
                      </div>
                    </div>
                  {field.fieldInfo && (
                    <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};