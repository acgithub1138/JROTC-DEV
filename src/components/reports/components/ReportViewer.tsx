import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ReportViewerProps {
  selectedTable: string;
  selectedFields: string[];
  onDataChange: (data: any[]) => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  selectedTable,
  selectedFields,
  onDataChange
}) => {
  const { userProfile } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedTable && selectedFields.length > 0) {
      fetchReportData();
    }
  }, [selectedTable, selectedFields]);

  const fetchReportData = async () => {
    if (!userProfile?.school_id) return;

    setIsLoading(true);
    try {
      let reportData: any[] = [];
      let error: any = null;

      // Handle different tables with proper typing
      switch (selectedTable) {
        case 'tasks':
          const tasksResult = await supabase
            .from('tasks')
            .select(selectedFields.join(','))
            .eq('school_id', userProfile.school_id)
            .limit(100);
          reportData = tasksResult.data || [];
          error = tasksResult.error;
          break;
        case 'profiles':
          const profilesResult = await supabase
            .from('profiles')
            .select(selectedFields.join(','))
            .eq('school_id', userProfile.school_id)
            .limit(100);
          reportData = profilesResult.data || [];
          error = profilesResult.error;
          break;
        case 'competitions':
          const competitionsResult = await supabase
            .from('competitions')
            .select(selectedFields.join(','))
            .eq('school_id', userProfile.school_id)
            .limit(100);
          reportData = competitionsResult.data || [];
          error = competitionsResult.error;
          break;
        case 'inventory_items':
          const inventoryResult = await supabase
            .from('inventory_items')
            .select(selectedFields.join(','))
            .eq('school_id', userProfile.school_id)
            .limit(100);
          reportData = inventoryResult.data || [];
          error = inventoryResult.error;
          break;
        case 'budget_transactions':
          const budgetResult = await supabase
            .from('budget_transactions')
            .select(selectedFields.join(','))
            .eq('school_id', userProfile.school_id)
            .limit(100);
          reportData = budgetResult.data || [];
          error = budgetResult.error;
          break;
        default:
          throw new Error(`Table ${selectedTable} is not supported for reports`);
      }

      if (error) throw error;

      setData(reportData);
      onDataChange(reportData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Report Results</CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{selectedTable}</Badge>
            <span className="text-sm text-muted-foreground">
              {data.length} records found
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Generating report...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No data found for the selected criteria
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {selectedFields.map((field) => (
                    <TableHead key={field} className="font-semibold">
                      {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    {selectedFields.map((field) => (
                      <TableCell key={field}>
                        {formatValue(row[field])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};