import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table';
import { useCompetitionEvents } from '@/hooks/competition-portal/useCompetitionEvents';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useSortableTable } from '@/hooks/useSortableTable';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { AddEventModal } from '@/components/competition-portal/modals/AddEventModal';
import { EditEventModal } from '@/components/competition-portal/modals/EditEventModal';
import { ViewJudgesModal } from '@/components/competition-portal/modals/ViewJudgesModal';
import { ViewResourcesModal } from '@/components/competition-portal/modals/ViewResourcesModal';
interface CompetitionEventsTabProps {
  competitionId: string;
}
export const CompetitionEventsTab: React.FC<CompetitionEventsTabProps> = ({
  competitionId
}) => {
  const { timezone } = useSchoolTimezone();
  const {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent
  } = useCompetitionEvents(competitionId);
  const {
    canCreate,
    canEdit,
    canDelete
  } = useTablePermissions('cp_comp_events');
  
  // Add sorting functionality
  const { sortedData: sortedEvents, sortConfig, handleSort } = useSortableTable({
    data: events,
    defaultSort: { key: 'start_time', direction: 'asc' }
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<typeof events[0] | null>(null);
  const [showJudgesModal, setShowJudgesModal] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [selectedEventForView, setSelectedEventForView] = useState<typeof events[0] | null>(null);
  const handleEditEvent = (event: typeof events[0]) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };
  const handleViewJudges = (event: typeof events[0]) => {
    setSelectedEventForView(event);
    setShowJudgesModal(true);
  };
  const handleViewResources = (event: typeof events[0]) => {
    setSelectedEventForView(event);
    setShowResourcesModal(true);
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
        {canCreate && <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>}
      </div>

      {sortedEvents.length === 0 ? <div className="text-center py-8 text-muted-foreground">
          <p>No events configured for this competition</p>
        </div> : <div className="border rounded-lg">
          <Table>
            <TableHeader>
               <TableRow>
                  <SortableTableHead sortKey="cp_events.name" currentSort={sortConfig} onSort={handleSort}>
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
                  <SortableTableHead sortKey="max_participants" currentSort={sortConfig} onSort={handleSort}>
                    Max
                  </SortableTableHead>
                  <TableHead className="text-center">Judges</TableHead>
                  <TableHead className="text-center">Resources</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {sortedEvents.map(event => <TableRow key={event.id}>
                   <TableCell className="font-medium py-[8px]">{event.cp_events?.name || 'N/A'}</TableCell>
                   <TableCell>{event.location || 'N/A'}</TableCell>
                    <TableCell>
                      {formatTimeForDisplay(event.start_time, TIME_FORMATS.DATETIME_24H, timezone)}
                    </TableCell>
                    <TableCell>
                      {formatTimeForDisplay(event.end_time, TIME_FORMATS.DATETIME_24H, timezone)}
                    </TableCell>
                    <TableCell>{event.max_participants || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
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
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleViewResources(event)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Resources</p>
                          </TooltipContent>
                        </Tooltip>
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
                                 <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => deleteEvent(event.id)}>
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

      <AddEventModal open={showAddModal} onOpenChange={setShowAddModal} competitionId={competitionId} onEventAdded={createEvent} />
      <EditEventModal open={showEditModal} onOpenChange={setShowEditModal} event={selectedEvent} onEventUpdated={updateEvent} />
      <ViewJudgesModal open={showJudgesModal} onOpenChange={setShowJudgesModal} event={selectedEventForView} />
      <ViewResourcesModal open={showResourcesModal} onOpenChange={setShowResourcesModal} event={selectedEventForView} />
    </div>
  </TooltipProvider>;
};