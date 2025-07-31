import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useCompetitionEvents } from './hooks/useCompetitionEvents';
import { CreateEventModal } from './CreateEventModal';
import { format } from 'date-fns';

export const EventsPage = () => {
  const { events, isLoading, deleteEvent } = useCompetitionEvents();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Not set';
    try {
      const [hours, minutes] = timeString.split(':');
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes));
      return format(time, 'h:mm a');
    } catch {
      return 'Invalid time';
    }
  };

  const handleDelete = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      await deleteEvent(eventId);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events & Scheduling</h1>
          <p className="text-muted-foreground">Manage competition events and schedules</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No events found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create your first event
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Max Participants</TableHead>
                  <TableHead>SOP</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>
                      {(event as any).cp_competitions?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>{formatDate(event.event_date)}</TableCell>
                    <TableCell>
                      {event.start_time && event.end_time 
                        ? `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`
                        : event.start_time 
                        ? formatTime(event.start_time)
                        : 'Not set'
                      }
                    </TableCell>
                    <TableCell>
                      {event.max_participants ? event.max_participants.toString() : 'Unlimited'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={event.sop === 'text' ? 'default' : 'secondary'}>
                        {event.sop === 'text' ? 'Text' : 'Link'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {/* TODO: Implement edit */}}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateEventModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />
    </div>
  );
};