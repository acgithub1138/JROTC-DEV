import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCadetInspections } from '@/hooks/useCadetRecords';
interface InspectionTabProps {
  cadetId: string;
}
export const InspectionTab: React.FC<InspectionTabProps> = ({
  cadetId
}) => {
  const {
    data: inspections = [],
    isLoading
  } = useCadetInspections(cadetId);
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Inspection Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading inspection records...</div>
        </CardContent>
      </Card>;
  }
  if (inspections.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>Inspection Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No inspection records found for this cadet.
          </div>
        </CardContent>
      </Card>;
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
  return <Card>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Date</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Grade</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Status</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Notes</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map(inspection => <tr key={inspection.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium px-[8px] py-[8px]">
                    {format(new Date(inspection.date), 'PPP')}
                  </td>
                  <td className="p-3 px-[8px] py-[8px]">
                    <Badge variant={getGradeBadgeVariant(inspection.grade)}>
                      {inspection.grade}%
                    </Badge>
                  </td>
                  <td className="p-3 px-[8px] py-[8px]">
                    <Badge variant="outline">
                      {getGradeLabel(inspection.grade)}
                    </Badge>
                  </td>
                  <td className="p-3 max-w-xs px-[8px] py-[8px]">
                    {inspection.notes || 'No notes'}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground px-[8px] py-[8px]">
                    {format(new Date(inspection.created_at), 'PP')}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>;
};