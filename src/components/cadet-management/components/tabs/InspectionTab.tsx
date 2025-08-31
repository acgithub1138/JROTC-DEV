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
        <div className="space-y-4">
          {inspections.map((inspection) => (
            <div key={inspection.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">
                  {format(new Date(inspection.date), 'PPP')}
                </h4>
                <div className="flex items-center gap-2">
                  <Badge variant={getGradeBadgeVariant(inspection.grade)}>
                    {inspection.grade}%
                  </Badge>
                  <Badge variant="outline">
                    {getGradeLabel(inspection.grade)}
                  </Badge>
                </div>
              </div>
              
              {inspection.notes && (
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">Notes:</span>
                  <div className="mt-1 text-foreground">{inspection.notes}</div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Recorded on {format(new Date(inspection.created_at), 'PPp')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};