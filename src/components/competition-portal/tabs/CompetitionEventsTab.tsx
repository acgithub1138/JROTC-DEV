import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompetitionEvents } from '@/hooks/competition-portal/useCompetitionEvents';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { AddEventModal } from '@/components/competition-portal/modals/AddEventModal';
interface CompetitionEventsTabProps {
  competitionId: string;
}
export const CompetitionEventsTab: React.FC<CompetitionEventsTabProps> = ({
  competitionId
}) => {
  const {
    events,
    isLoading,
    createEvent
  } = useCompetitionEvents(competitionId);
  const {
    canCreate
  } = useTablePermissions('cp_comp_events');
  const [showAddModal, setShowAddModal] = useState(false);
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

      {events.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No events configured for this competition</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Max Participants</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(event => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.cp_events?.name || 'N/A'}</TableCell>
                  <TableCell>{event.location || 'N/A'}</TableCell>
                  <TableCell>
                    {event.start_time ? new Date(event.start_time).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {event.end_time ? new Date(event.end_time).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell>{event.max_participants || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddEventModal open={showAddModal} onOpenChange={setShowAddModal} competitionId={competitionId} onEventAdded={createEvent} />
    </div>;
};