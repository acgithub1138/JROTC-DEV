import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TableSelector } from './components/TableSelector';
import { FieldSelector } from './components/FieldSelector';
import { ReportViewer } from './components/ReportViewer';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    if (!selectedTable || selectedFields.length === 0) return;
    
    setIsGenerating(true);
    // Report generation will be implemented in ReportViewer
    setIsGenerating(false);
  };

  const handleTableChange = (table: string) => {
    setSelectedTable(table);
    setSelectedFields([]);
    setReportData([]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate custom reports by selecting tables and fields
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Select Table
            </CardTitle>
            <CardDescription>
              Choose a table to generate reports from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TableSelector
              selectedTable={selectedTable}
              onTableChange={handleTableChange}
            />
          </CardContent>
        </Card>

        {/* Field Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Fields</CardTitle>
            <CardDescription>
              Choose which fields to include in your report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldSelector
              selectedTable={selectedTable}
              selectedFields={selectedFields}
              onFieldsChange={setSelectedFields}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>
              Create and export your custom report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGenerateReport}
              disabled={!selectedTable || selectedFields.length === 0 || isGenerating}
              className="w-full"
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
            
            {reportData.length > 0 && (
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export to CSV
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report Viewer */}
      {selectedTable && selectedFields.length > 0 && (
        <ReportViewer
          selectedTable={selectedTable}
          selectedFields={selectedFields}
          onDataChange={setReportData}
        />
      )}
    </div>
  );
};