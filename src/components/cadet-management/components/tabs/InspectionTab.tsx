import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCadetInspections } from '@/hooks/useCadetRecords';
interface InspectionTabProps {
  cadetId: string;
}
export const InspectionTab: React.FC<InspectionTabProps> = ({
  cadetId
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  const {
    data: inspections = [],
    isLoading
  } = useCadetInspections(cadetId);

  // Calculate pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return inspections.slice(startIndex, endIndex);
  }, [inspections, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(inspections.length / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
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
      <CardHeader>
        <CardTitle>
          Inspection Records
          {inspections.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({inspections.length} total records)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
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
              {paginatedData.map(inspection => <tr key={inspection.id} className="border-b hover:bg-muted/50">
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

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {paginatedData.map(inspection => (
            <Card key={inspection.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="font-medium">
                  {format(new Date(inspection.date), 'PPP')}
                </div>
                <Badge variant={getGradeBadgeVariant(inspection.grade)}>
                  {inspection.grade}%
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Status:</span>
                  <Badge variant="outline" className="text-xs">
                    {getGradeLabel(inspection.grade)}
                  </Badge>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Notes:</div>
                  <div className="text-sm mt-1">{inspection.notes || 'No notes'}</div>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Recorded: {format(new Date(inspection.created_at), 'PP')}
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, inspections.length)} of {inspections.length} records
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>;
};