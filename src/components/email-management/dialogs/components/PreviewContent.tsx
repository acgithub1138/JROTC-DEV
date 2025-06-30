
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useEmailPreview } from '@/hooks/email/useEmailPreview';

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
  const { data: previewData, isLoading, error } = useEmailPreview(subject, body, recordData);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading preview...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Error generating preview: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!previewData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Select a record to see the email preview
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Email Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">Subject:</div>
          <div className="p-3 bg-gray-50 rounded border text-sm">
            {previewData.processedSubject || '(No subject)'}
          </div>
        </div>
        
        <Separator />
        
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">Body:</div>
          <div className="p-3 bg-gray-50 rounded border text-sm whitespace-pre-wrap min-h-[200px]">
            {previewData.processedBody || '(No body content)'}
          </div>
        </div>

        {/* Show unresolved variables if any */}
        {(previewData.processedSubject?.includes('{{') || previewData.processedBody?.includes('{{')) && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="text-sm font-medium text-yellow-800 mb-1">⚠️ Unresolved Variables</div>
            <div className="text-xs text-yellow-700">
              Some variables in your template could not be resolved with the selected record data.
              Please check your variable names and ensure they match available fields.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
