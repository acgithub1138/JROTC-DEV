import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ChevronLeft, ChevronRight, Download } from 'lucide-react';
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

  const handleExportCSV = () => {
    if (communityService.length === 0) return;

    // CSV headers
    const headers = ['Date', 'Event', 'Hours', 'Notes', 'Recorded'];
    
    // Convert data to CSV format
    const csvData = communityService.map(service => [
      format(new Date(service.date), 'yyyy-MM-dd'),
      `"${service.event || ''}"`,
      service.hours || 0,
      `"${service.notes || ''}"`,
      format(new Date(service.created_at), 'yyyy-MM-dd')
    ]);

    // Combine headers and data
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `community-service-records-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
        <div className="flex items-center justify-between">
          <CardTitle>
            Community Service Records
            {communityService.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({communityService.length} total records, {totalHours} hours)
              </span>
            )}
          </CardTitle>
          {communityService.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="ml-4"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Community Service
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
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

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {paginatedData.map(service => (
            <Card key={service.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="font-medium">
                  {format(new Date(service.date), 'PPP')}
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {service.hours} hrs
                </Badge>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-muted-foreground text-sm">Event:</div>
                  <div className="font-medium">{service.event}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">Notes:</div>
                  <div className="text-sm mt-1">{service.notes || 'No notes'}</div>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Recorded: {format(new Date(service.created_at), 'PP')}
                </div>
              </div>
            </Card>
          ))}
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