import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { useCompetitionEvents } from './hooks/useCompetitionEvents';
import { CreateEventModal } from './modals/CreateEventModal';
import { EditCpEventModal } from './modals/EditCpEventModal';
import { JROTC_PROGRAM_OPTIONS } from '../competition-management/utils/constants';
import { format } from 'date-fns';
export const EventsPage = () => {
  const {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch
  } = useCompetitionEvents();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<typeof events[0] | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<typeof events[0] | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getEventTypeLabel = (value: string | null) => {
    if (!value) return 'Not set';
    const option = JROTC_PROGRAM_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedEvents = [...events].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    let aValue: any = a[key as keyof typeof a];
    let bValue: any = b[key as keyof typeof b];

    // Handle special cases
    if (key === 'jrotc_program') {
      aValue = getEventTypeLabel(aValue);
      bValue = getEventTypeLabel(bValue);
    }

    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const SortableHeader = ({ children, sortKey }: { children: React.ReactNode; sortKey: string }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown className="h-4 w-4 opacity-50" />
      </div>
    </TableHead>
  );

  const handleEdit = (event: typeof events[0]) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (event: typeof events[0]) => {
    setDeleteConfirmEvent(event);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmEvent) {
      await deleteEvent(deleteConfirmEvent.id);
      setDeleteConfirmEvent(null);
    }
  };
  if (isLoading) {
    return <div className="p-6">
        <div className="text-center">Loading events...</div>
      </div>;
  }
  return <TooltipProvider>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground">Manage competition events</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>

        <Card>
          <CardContent>
            {events.length === 0 ? <div className="text-center py-8">
                <p className="text-muted-foreground">No events found</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                  Create your first event
                </Button>
              </div> : <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader sortKey="name">Event Name</SortableHeader>
                    <SortableHeader sortKey="jrotc_program">Event Type</SortableHeader>
                    <SortableHeader sortKey="description">Description</SortableHeader>
                    <SortableHeader sortKey="score_sheet">Score Sheet</SortableHeader>
                    <SortableHeader sortKey="created_at">Created</SortableHeader>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEvents.map(event => <TableRow key={event.id}>
                      <TableCell className="font-medium py-[8px]">{event.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getEventTypeLabel(event.jrotc_program)}</Badge>
                      </TableCell>
                      <TableCell>{event.description || 'No description'}</TableCell>
                      <TableCell>
                        {event.score_sheet ? <Badge variant="default">Assigned</Badge> : <Badge variant="secondary">No template</Badge>}
                      </TableCell>
                      <TableCell>{formatDate(event.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleEdit(event)}>
                                <Edit className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit event</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleDeleteClick(event)}>
                                <Trash2 className="w-3 h-3 text-red-600 hover:text-red-700 hover:border-red-300" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Archive event</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>}
          </CardContent>
        </Card>

        <CreateEventModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} onSuccess={refetch} onEventCreate={createEvent} />
        <EditCpEventModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} event={selectedEvent} onEventUpdate={updateEvent} onSuccess={refetch} />
        
        <AlertDialog open={!!deleteConfirmEvent} onOpenChange={(open) => !open && setDeleteConfirmEvent(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the event "{deleteConfirmEvent?.name}"? This action cannot be undone and will remove the event permanently.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete Event
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>;
};