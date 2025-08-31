import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, User, FileText } from 'lucide-react';
import { useCadetHistory } from '@/hooks/useCadetRecords';
interface HistoryTabProps {
  cadetId: string;
}
export const HistoryTab: React.FC<HistoryTabProps> = ({
  cadetId
}) => {
  const {
    data: history = [],
    isLoading
  } = useCadetHistory(cadetId);
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
      
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-[8px] py-[8px]">Type</TableHead>
                <TableHead className="px-[8px] py-[8px]">Description</TableHead>
                <TableHead className="px-[8px] py-[8px]">Details</TableHead>
                <TableHead className="px-[8px] py-[8px]">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map(entry => <TableRow key={entry.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2 py-[8px]">
                      {getTypeIcon(entry.type)}
                      <Badge variant={getTypeBadgeVariant(entry.type)}>
                        {entry.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{entry.description}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {entry.details || '-'}
                    </span>
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
      </CardContent>
    </Card>;
};