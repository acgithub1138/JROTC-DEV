import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCadetInspections } from '@/hooks/useCadetRecords';

interface InspectionTabProps {
  cadetId: string;
}

export const InspectionTab: React.FC<InspectionTabProps> = ({ cadetId }) => {
  const { data: inspections = [], isLoading } = useCadetInspections(cadetId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inspection Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading inspection records...</div>
        </CardContent>
      </Card>
    );
  }

  if (inspections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inspection Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No inspection records found for this cadet.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getGradeBadgeVariant = (grade: number) => {
    if (grade >= 90) return 'default';
    if (grade >= 80) return 'secondary';
    if (grade >= 70) return 'outline';
    return 'destructive';
  };

  const getGradeLabel = (grade: number) => {
    if (grade >= 90) return 'Excellent';
    if (grade >= 80) return 'Good';
    if (grade >= 70) return 'Satisfactory';
    return 'Needs Improvement';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspection Records ({inspections.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Date</th>
                <th className="text-left p-3 font-semibold">Grade</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-left p-3 font-semibold">Notes</th>
                <th className="text-left p-3 font-semibold">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((inspection) => (
                <tr key={inspection.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium">
                    {format(new Date(inspection.date), 'PPP')}
                  </td>
                  <td className="p-3">
                    <Badge variant={getGradeBadgeVariant(inspection.grade)}>
                      {inspection.grade}%
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline">
                      {getGradeLabel(inspection.grade)}
                    </Badge>
                  </td>
                  <td className="p-3 max-w-xs">
                    {inspection.notes || 'No notes'}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {format(new Date(inspection.created_at), 'PP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};