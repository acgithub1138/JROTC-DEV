import React, { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { RecordSelector } from './dialogs/components/RecordSelector';
import { PreviewContent } from './dialogs/components/PreviewContent';

export const EmailPreviewRecordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Get preview data from search params or location state
  const state = location.state as any;
  const subject = searchParams.get('subject') || state?.subject || '';
  const body = searchParams.get('body') || state?.body || '';
  const sourceTable = searchParams.get('sourceTable') || state?.sourceTable || '';
  const templateId = searchParams.get('templateId') || state?.templateId;

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedRecordData, setSelectedRecordData] = useState<any>(null);

  const handleRecordSelect = (recordId: string, recordData: any) => {
    setSelectedRecordId(recordId);
    setSelectedRecordData(recordData);
  };

  const handleBack = () => {
    // Navigate back to where they came from
    if (location.state?.from) {
      navigate(location.state.from);
    } else {
      navigate('/app/email');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Preview Email Template</h1>
      </div>

      <div className="space-y-6">
        {/* Template Info */}
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Subject Template:</strong>
                <div className="mt-1 p-2 bg-muted rounded text-xs font-mono">
                  {subject || 'No subject'}
                </div>
              </div>
              <div>
                <strong>Source Table:</strong>
                <div className="mt-1 p-2 bg-muted rounded">
                  {sourceTable || 'No source table'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Record Selector */}
        {sourceTable && (
          <Card>
            <CardHeader>
              <CardTitle>Select Test Data</CardTitle>
            </CardHeader>
            <CardContent>
              <RecordSelector 
                tableName={sourceTable} 
                selectedRecordId={selectedRecordId} 
                onRecordSelect={handleRecordSelect} 
              />
            </CardContent>
          </Card>
        )}

        {/* Preview Content */}
        <PreviewContent 
          subject={subject} 
          body={body} 
          recordData={selectedRecordData} 
        />
      </div>
    </div>
  );
};