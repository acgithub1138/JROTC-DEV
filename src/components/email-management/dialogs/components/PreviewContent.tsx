import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { processTemplate } from '@/utils/templateProcessor';

interface PreviewContentProps {
  subject: string;
  body: string;
  recordData: any;
}

export const PreviewContent: React.FC<PreviewContentProps> = ({
  subject,
  body,
  recordData,
}) => {
  if (!recordData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Select a record to preview the email content
          </div>
        </CardContent>
      </Card>
    );
  }

  const processedSubject = processTemplate(subject, recordData);
  const processedBody = processTemplate(body, recordData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>Subject:</strong>
          <div className="mt-1 p-2 bg-muted rounded border">
            {processedSubject}
          </div>
        </div>
        
        <div>
          <strong>Body:</strong>
          <div className="mt-1 p-4 bg-muted rounded border">
            <div 
              dangerouslySetInnerHTML={{ __html: processedBody }}
              className="prose prose-sm max-w-none"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};