import React, { useState, useMemo } from 'react';
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
import { CommunityServiceDialog } from './CommunityServiceDialog';
import { TableActionButtons } from '@/components/ui/table-action-buttons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
interface CommunityServiceTabProps {
  searchTerm?: string;
}
export const CommunityServiceTab: React.FC<CommunityServiceTabProps> = ({
  searchTerm
}) => {
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
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedRecord, setSelectedRecord] = useState<CommunityServiceRecord | null>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const {
    records: communityServiceRecords,
    isLoading,
    createRecord,
    updateRecord,
    deleteRecord,
    isCreating,
    isUpdating,
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

  // Dialog handlers
  const handleAddRecord = () => {
    setSelectedRecord(null);
    setDialogMode('create');
    setIsDialogOpen(true);
  };
  const handleEditRecord = (record: CommunityServiceRecord) => {
    setSelectedRecord(record);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };
  const handleViewRecord = (record: CommunityServiceRecord) => {
    setSelectedRecord(record);
    setDialogMode('view');
    setIsDialogOpen(true);
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
  const handleDialogSubmit = (data: any) => {
    if (dialogMode === 'create') {
      createRecord(data);
    } else if (dialogMode === 'edit') {
      updateRecord(data);
    }
    setIsDialogOpen(false);
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
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Filter by date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus className="p-3 pointer-events-auto" />
              <div className="p-3 border-t">
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(undefined)} className="w-full">
                  Clear Filter
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {canCreate && <Button onClick={handleAddRecord} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Service Hours
          </Button>}
      </div>

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
        </Card> : <Card>
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
                {(canViewDetails || canEdit || canDelete) && <TableHead className="text-center">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map(record => <TableRow key={record.id}>
                  <TableCell>
                    <div className="font-medium">
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
                  {(canViewDetails || canEdit || canDelete) && <TableCell className="text-center">
                      <TableActionButtons canView={canViewDetails} canEdit={canEdit} canDelete={canDelete} onView={() => handleViewRecord(record)} onEdit={() => handleEditRecord(record)} onDelete={() => handleDeleteRecord(record)} />
                    </TableCell>}
                </TableRow>)}
            </TableBody>
          </Table>
        </Card>}

      {/* Community Service Dialog */}
      <CommunityServiceDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} record={selectedRecord} onSubmit={handleDialogSubmit} mode={dialogMode} isSubmitting={isCreating || isUpdating} />

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