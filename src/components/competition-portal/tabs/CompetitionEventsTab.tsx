import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompetitionEvents } from '@/hooks/competition-portal/useCompetitionEvents';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { AddEventModal } from '@/components/competition-portal/modals/AddEventModal';
import { EditEventModal } from '@/components/competition-portal/modals/EditEventModal';
import { format } from 'date-fns';
interface CompetitionEventsTabProps {
  competitionId: string;
}
export const CompetitionEventsTab: React.FC<CompetitionEventsTabProps> = ({
  competitionId
}) => {
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<typeof events[0] | null>(null);
  const handleEditEvent = (event: typeof events[0]) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };
  if (isLoading) {
    return <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}
      </div>;
  }
  return <div className="space-y-4">
      <div className="flex items-center justify-between py-[8px]">
        <h2 className="text-lg font-semibold">Competition Events</h2>
        {canCreate && <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>}
      </div>

      {events.length === 0 ? <div className="text-center py-8 text-muted-foreground">
          <p>No events configured for this competition</p>
        </div> : <div className="border rounded-lg">
          <Table>
            <TableHeader>
               <TableRow>
                 <TableHead>Event</TableHead>
                 <TableHead>Location</TableHead>
                 <TableHead>Start Time</TableHead>
                 <TableHead>End Time</TableHead>
                 <TableHead>Max</TableHead>
                 <TableHead className="text-center">Actions</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {events.map(event => <TableRow key={event.id}>
                   <TableCell className="font-medium py-[8px]">{event.cp_events?.name || 'N/A'}</TableCell>
                   <TableCell>{event.location || 'N/A'}</TableCell>
                   <TableCell>
                     {event.start_time ? format(new Date(event.start_time), 'yyyy-MM-dd HH:mm') : 'N/A'}
                   </TableCell>
                   <TableCell>
                     {event.end_time ? format(new Date(event.end_time), 'yyyy-MM-dd HH:mm') : 'N/A'}
                   </TableCell>
                   <TableCell>{event.max_participants || 'N/A'}</TableCell>
                    {(canEdit || canDelete) && <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          {canEdit && <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleEditEvent(event)}>
                              <Edit className="w-3 h-3" />
                            </Button>}
                          {canDelete && <Button variant="outline" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => deleteEvent(event.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>}
                        </div>
                      </TableCell>}
                 </TableRow>)}
            </TableBody>
          </Table>
        </div>}

      <AddEventModal open={showAddModal} onOpenChange={setShowAddModal} competitionId={competitionId} onEventAdded={createEvent} />
      <EditEventModal open={showEditModal} onOpenChange={setShowEditModal} event={selectedEvent} onEventUpdated={updateEvent} />
    </div>;
};