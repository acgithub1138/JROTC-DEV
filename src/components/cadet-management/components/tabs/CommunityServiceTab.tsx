import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCadetCommunityService } from '@/hooks/useCadetRecords';
interface CommunityServiceTabProps {
  cadetId: string;
}
export const CommunityServiceTab: React.FC<CommunityServiceTabProps> = ({
  cadetId
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  const {
    data: communityService = [],
    isLoading
  } = useCadetCommunityService(cadetId);

  // Calculate pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return communityService.slice(startIndex, endIndex);
  }, [communityService, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(communityService.length / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Community Service Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading community service records...</div>
        </CardContent>
      </Card>;
  }
  if (communityService.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>Community Service Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No community service records found for this cadet.
          </div>
        </CardContent>
      </Card>;
  }

  // Calculate total hours
  const totalHours = communityService.reduce((sum, service) => sum + (service.hours || 0), 0);
  return <Card>
      <CardHeader>
        <CardTitle>
          Community Service Records
          {communityService.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({communityService.length} total records, {totalHours} hours)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Date</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Event</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Hours</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Notes</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map(service => <tr key={service.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium px-[8px] py-[8px]">
                    {format(new Date(service.date), 'PPP')}
                  </td>
                  <td className="p-3 px-[8px] py-[8px]">{service.event}</td>
                  <td className="p-3 px-[8px] py-[8px]">
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <Clock className="h-3 w-3" />
                      {service.hours} hrs
                    </Badge>
                  </td>
                  <td className="p-3 max-w-xs px-[8px] py-[8px]">
                    {service.notes || 'No notes'}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground px-[8px] py-[8px]">
                    {format(new Date(service.created_at), 'PP')}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, communityService.length)} of {communityService.length} records
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