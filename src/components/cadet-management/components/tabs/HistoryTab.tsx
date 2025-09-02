import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, User, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCadetHistory } from '@/hooks/useCadetRecords';
interface HistoryTabProps {
  cadetId: string;
}
export const HistoryTab: React.FC<HistoryTabProps> = ({
  cadetId
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  const {
    data: history = [],
    isLoading
  } = useCadetHistory(cadetId);

  // Calculate pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return history.slice(startIndex, endIndex);
  }, [history, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(history.length / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Cadet History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading cadet history...</div>
        </CardContent>
      </Card>;
  }
  if (history.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Cadet History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No history records found for this cadet.
          </div>
        </CardContent>
      </Card>;
  }
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'profile created':
      case 'profile updated':
        return <User className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  const getTypeBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'profile created':
        return 'default';
      case 'profile updated':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Cadet History
          {history.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({history.length} total records)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-[8px] py-[8px]">Type</TableHead>
                <TableHead className="px-[8px] py-[8px]">User</TableHead>
                <TableHead className="px-[8px] py-[8px]">Details</TableHead>
                <TableHead className="px-[8px] py-[8px]">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map(entry => <TableRow key={entry.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2 py-[8px]">
                      {getTypeIcon(entry.type)}
                      <Badge variant={getTypeBadgeVariant(entry.type)}>
                        {entry.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{entry.user_name || 'Unknown'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {entry.details ? (
                        entry.details.includes(',') ? (
                          <ul className="list-disc list-inside space-y-1">
                            {entry.details.split(',').map((item, index) => (
                              <li key={index}>{item.trim()}</li>
                            ))}
                          </ul>
                        ) : (
                          <span>{entry.details}</span>
                        )
                      ) : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {format(new Date(entry.date), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, history.length)} of {history.length} records
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