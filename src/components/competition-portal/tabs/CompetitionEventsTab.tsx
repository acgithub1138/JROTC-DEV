import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCompetitionEvents } from '@/hooks/competition-portal/useCompetitionEvents';
import { useCompetitionEventsPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useSortableTable } from '@/hooks/useSortableTable';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useIsMobile } from '@/hooks/use-mobile';
import { convertToUI } from '@/utils/timezoneUtils';
// Modals removed - using page navigation instead
import { ViewJudgesModal } from '@/components/competition-portal/modals/ViewJudgesModal';
import { ViewEventSchoolsModal } from '@/components/competition-portal/modals/ViewEventSchoolsModal';
interface CompetitionEventsTabProps {
  competitionId: string;
}
export const CompetitionEventsTab: React.FC<CompetitionEventsTabProps> = ({
  competitionId
}) => {
  const navigate = useNavigate();
  const { timezone } = useSchoolTimezone();
  const isMobile = useIsMobile();
  const {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent
  } = useCompetitionEvents(competitionId);
  const {
    canCreate,
    canView,
    canViewDetails,
    canEdit,
    canDelete
  } = useCompetitionEventsPermissions();
  
  // Add sorting functionality
  const { sortedData: sortedEvents, sortConfig, handleSort } = useSortableTable({
    data: events,
    defaultSort: { key: 'event_name', direction: 'asc' }
  });
  // Modal states removed - using page navigation instead
  const [showJudgesModal, setShowJudgesModal] = useState(false);
  const [showSchoolsModal, setShowSchoolsModal] = useState(false);
  const [selectedEventForView, setSelectedEventForView] = useState<typeof events[0] | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<typeof events[0] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const handleEditEvent = (event: typeof events[0]) => {
    navigate(`/app/competition-portal/competition-details/${competitionId}/events_record?mode=edit&id=${event.id}`);
  };
  const handleViewJudges = (event: typeof events[0]) => {
    setSelectedEventForView(event);
    setShowJudgesModal(true);
  };

  const handleViewSchools = (event: typeof events[0]) => {
    setSelectedEventForView(event);
    setShowSchoolsModal(true);
  };

  const handleDeleteClick = (event: typeof events[0]) => {
    setEventToDelete(event);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteEvent(eventToDelete.id);
      setShowDeleteDialog(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  if (isLoading) {
    return <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}
      </div>;
  }
  return <TooltipProvider>
    <div className="space-y-4">
      <div className="flex items-center justify-between py-[8px]">
        <h2 className="text-lg font-semibold">Competition Events</h2>
        {canCreate && <Button onClick={() => navigate(`/app/competition-portal/competition-details/${competitionId}/events_record?mode=create`)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>}
      </div>

      {!canView ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>You don't have permission to view events</p>
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No events configured for this competition</p>
        </div>
      ) : isMobile ? (
          <div className="space-y-4">
            {sortedEvents.map(event => (
              <Card key={event.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{event.event_name || 'N/A'}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Location:</span>
                      <p className="text-sm">{event.location || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Start:</span>
                      <p className="text-sm">{convertToUI(event.start_time, timezone, 'datetime')}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">End:</span>
                      <p className="text-sm">{convertToUI(event.end_time, timezone, 'datetime')}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Registered:</span>
                      <p className="text-sm">
                        {event.registration_count !== undefined 
                          ? `${event.registration_count}${event.max_participants ? `/${event.max_participants}` : ''}`
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 pt-2">
                      {canViewDetails && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleViewJudges(event)}>
                              <Eye className="w-4 h-4 mr-1" />
                              Judges
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Judges</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {canViewDetails && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleViewSchools(event)}>
                              <Eye className="w-4 h-4 mr-1" />
                              Schools
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Schools</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {canEdit && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleEditEvent(event)}>
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Event</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => handleDeleteClick(event)}>
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete Event</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : <div className="border rounded-lg">
          <Table>
            <TableHeader>
               <TableRow>
                  <SortableTableHead sortKey="event_name" currentSort={sortConfig} onSort={handleSort}>
                    Event
                  </SortableTableHead>
                  <SortableTableHead sortKey="location" currentSort={sortConfig} onSort={handleSort}>
                    Location
                  </SortableTableHead>
                  <SortableTableHead sortKey="start_time" currentSort={sortConfig} onSort={handleSort}>
                    Start
                  </SortableTableHead>
                  <SortableTableHead sortKey="end_time" currentSort={sortConfig} onSort={handleSort}>
                    End
                  </SortableTableHead>
                  <SortableTableHead sortKey="registration_count" currentSort={sortConfig} onSort={handleSort}>
                    Registered
                  </SortableTableHead>
                  <TableHead className="text-center">Judges</TableHead>
                  <TableHead className="text-center">Schools</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {sortedEvents.map(event => <TableRow key={event.id}>
                   <TableCell className="font-medium py-[8px]">{event.event_name || 'N/A'}</TableCell>
                   <TableCell>{event.location || 'N/A'}</TableCell>
                    <TableCell>
                      {convertToUI(event.start_time, timezone, 'datetime')}
                    </TableCell>
                    <TableCell>
                      {convertToUI(event.end_time, timezone, 'datetime')}
                    </TableCell>
                    <TableCell>
                      {event.registration_count !== undefined 
                        ? `${event.registration_count}${event.max_participants ? `/${event.max_participants}` : ''}`
                        : 'N/A'
                      }
                    </TableCell>
                     <TableCell>
                       <div className="flex items-center justify-center">
                         {canViewDetails && (
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleViewJudges(event)}>
                                 <Eye className="w-3 h-3" />
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent>
                               <p>View Judges</p>
                             </TooltipContent>
                           </Tooltip>
                         )}
                       </div>
                     </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {canViewDetails && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleViewSchools(event)}>
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Schools</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                     {(canEdit || canDelete) && <TableCell>
                         <div className="flex items-center justify-center gap-2">
                           {canEdit && <Tooltip>
                               <TooltipTrigger asChild>
                                 <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleEditEvent(event)}>
                                   <Edit className="w-3 h-3" />
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent>
                                 <p>Edit Event</p>
                               </TooltipContent>
                             </Tooltip>}
                            {canDelete && <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => handleDeleteClick(event)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete Event</p>
                                </TooltipContent>
                              </Tooltip>}
                         </div>
                       </TableCell>}
                 </TableRow>)}
            </TableBody>
          </Table>
        </div>}

      {/* Modals removed - using page navigation instead */}
      <ViewJudgesModal open={showJudgesModal} onOpenChange={setShowJudgesModal} eventId={selectedEventForView?.id || null} />
      <ViewEventSchoolsModal open={showSchoolsModal} onOpenChange={setShowSchoolsModal} event={selectedEventForView} />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the event "{eventToDelete?.event_name || 'this event'}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </TooltipProvider>;
};