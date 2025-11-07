import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { SortableTableHead } from '@/components/ui/sortable-table';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from 'use-debounce';
import { useSortableTable } from '@/hooks/useSortableTable';
import { useCommunityService, CommunityServiceRecord } from '../hooks/useCommunityService';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
interface CommunityServiceTabProps {
  searchTerm?: string;
  selectedDate?: Date;
}
export const CommunityServiceTab: React.FC<CommunityServiceTabProps> = ({
  searchTerm,
  selectedDate
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    userProfile
  } = useAuth();
  const {
    canView,
    canViewDetails,
    canEdit,
    canDelete,
    canCreate
  } = useTablePermissions('community_service');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const {
    records: communityServiceRecords,
    isLoading,
    deleteRecord,
    isDeleting
  } = useCommunityService(debouncedSearchTerm, selectedDate);

  // Set up sortable table with custom sorting logic
  const {
    sortedData,
    sortConfig,
    handleSort
  } = useSortableTable({
    data: communityServiceRecords,
    defaultSort: {
      key: 'date',
      direction: 'desc'
    },
    customSortFn: (a: CommunityServiceRecord, b: CommunityServiceRecord, sortConfig) => {
      if (sortConfig.key === 'cadet') {
        const nameA = `${a.cadet.last_name}, ${a.cadet.first_name}`;
        const nameB = `${b.cadet.last_name}, ${b.cadet.first_name}`;
        const comparison = nameA.localeCompare(nameB);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      if (sortConfig.key === 'grade') {
        const gradeA = a.cadet.grade || '';
        const gradeB = b.cadet.grade || '';
        const comparison = gradeA.localeCompare(gradeB);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      return 0; // Fall back to default sorting
    }
  });

  // Action handlers
  const handleEditRecord = (record: CommunityServiceRecord) => {
    navigate(`/app/cadets/service_record_edit/${record.id}`);
  };
  
  const handleDeleteRecord = (record: CommunityServiceRecord) => {
    setDeleteRecordId(record.id);
  };
  
  const confirmDelete = () => {
    if (deleteRecordId) {
      deleteRecord(deleteRecordId);
      setDeleteRecordId(null);
    }
  };
  if (!canView) {
    return <div>You do not have permission to view community service records.</div>;
  }
  if (isLoading) {
    return <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-[200px]" />
          </div>
          <Skeleton className="h-10 w-[140px]" />
        </div>
        
        <div className="rounded-md border">
          <div className="p-4">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          </div>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Community Service Display */}
      {sortedData.length === 0 ? <Card className="p-8">
          <div className="text-center">
            <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Community Service Records</h3>
            <p className="text-muted-foreground mb-4">
              {debouncedSearchTerm || selectedDate ? "No records match your current filters." : "No community service records have been added yet."}
            </p>
            {canCreate && !debouncedSearchTerm && !selectedDate}
          </div>
        </Card> : 
        isMobile ? (
          <div className="space-y-4">
            {sortedData.map(record => (
              <Card key={record.id} className="p-4">
                <div className="mb-3">
                  <h4 className="font-medium">{record.cadet.last_name}, {record.cadet.first_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {record.cadet.grade && (
                      <Badge variant="outline" className="text-xs">
                        {record.cadet.grade}
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(record.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hours:</span>
                    <span className="font-medium">{record.hours}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Event:</span>
                    <p className="text-sm mt-1">{record.event}</p>
                  </div>
                </div>
                {(canEdit || canDelete) && (
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t">
                    <TableActionButtons 
                      canView={false} 
                      canEdit={canEdit} 
                      canDelete={canDelete} 
                      onEdit={() => handleEditRecord(record)} 
                      onDelete={() => handleDeleteRecord(record)} 
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead sortKey="cadet" currentSort={sortConfig} onSort={handleSort}>
                  Cadet
                </SortableTableHead>
                <SortableTableHead sortKey="grade" currentSort={sortConfig} onSort={handleSort} className="text-center">
                  Grade
                </SortableTableHead>
                <SortableTableHead sortKey="date" currentSort={sortConfig} onSort={handleSort}>
                  Date
                </SortableTableHead>
                <SortableTableHead sortKey="hours" currentSort={sortConfig} onSort={handleSort} className="text-center">
                  Hours
                </SortableTableHead>
                <SortableTableHead sortKey="event" currentSort={sortConfig} onSort={handleSort}>
                  Event/Activity
                </SortableTableHead>
                {(canEdit || canDelete) && <TableHead className="text-center">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map(record => <TableRow key={record.id}>
                  <TableCell>
                    <div className="font-medium py-[6px]">
                      {record.cadet.last_name}, {record.cadet.first_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {record.cadet.grade && <Badge variant="outline" className="font-mono text-xs">
                        {record.cadet.grade}
                      </Badge>}
                  </TableCell>
                  <TableCell>
                    {format(new Date(record.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {record.hours}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px] truncate" title={record.event}>
                      {record.event}
                    </div>
                  </TableCell>
                  {(canEdit || canDelete) && <TableCell className="text-center">
                      <TableActionButtons canView={false} canEdit={canEdit} canDelete={canDelete} onEdit={() => handleEditRecord(record)} onDelete={() => handleDeleteRecord(record)} />
                    </TableCell>}
                </TableRow>)}
            </TableBody>
          </Table>
        </Card>
        )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRecordId} onOpenChange={() => setDeleteRecordId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Community Service Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this community service record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};