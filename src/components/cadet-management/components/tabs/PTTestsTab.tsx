import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCadetPTTests } from '@/hooks/useCadetRecords';
import { usePTTestPermissions } from '@/hooks/useModuleSpecificPermissions';
interface PTTestsTabProps {
  cadetId: string;
}
export const PTTestsTab: React.FC<PTTestsTabProps> = ({
  cadetId
}) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  const {
    data: ptTests = [],
    isLoading
  } = useCadetPTTests(cadetId);

  const { canEdit } = usePTTestPermissions();

  // Calculate pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return ptTests.slice(startIndex, endIndex);
  }, [ptTests, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(ptTests.length / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>PT Test Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading PT test records...</div>
        </CardContent>
      </Card>;
  }
  if (ptTests.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>PT Test Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No PT test records found for this cadet.
          </div>
        </CardContent>
      </Card>;
  }
  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return <Card>
      <CardHeader>
        <CardTitle>
          PT Test Records
          {ptTests.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({ptTests.length} total records)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b py-[6px] px-[8px]">
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Date</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[8px]">Push-ups</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[6px]">Sit-ups</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[6px]">Plank</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[6px]">Mile Run</th>
                <th className="text-left p-3 font-semibold px-[8px] py-[6px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map(test => <tr key={test.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 font-medium px-[8px] py-[4px]">
                    {format(new Date(test.date), 'PPP')}
                  </td>
                  <td className="p-3 px-[8px] py-[4px]">{test.push_ups || 'N/A'}</td>
                  <td className="p-3 px-[8px] py-[4px]">{test.sit_ups || 'N/A'}</td>
                  <td className="p-3 px-[8px] py-[4px]">{formatTime(test.plank_time)}</td>
                  <td className="p-3 px-[8px] py-[4px]">{formatTime(test.mile_time)}</td>
                  <td className="p-3 px-[8px] py-[4px]">
                    {canEdit && (
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/app/cadets/pt_test_edit?id=${test.id}`)}>
                        <Edit className="w-4 h-4 mr-2" />
                      </Button>
                    )}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {paginatedData.map(test => (
            <Card key={test.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="font-medium">
                  {format(new Date(test.date), 'PPP')}
                </div>
                {canEdit && (
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/app/cadets/pt_test_edit?id=${test.id}`)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Push-ups:</span>
                  <div className="font-medium">{test.push_ups || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Sit-ups:</span>
                  <div className="font-medium">{test.sit_ups || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Plank:</span>
                  <div className="font-medium">{formatTime(test.plank_time)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Mile Run:</span>
                  <div className="font-medium">{formatTime(test.mile_time)}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, ptTests.length)} of {ptTests.length} records
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