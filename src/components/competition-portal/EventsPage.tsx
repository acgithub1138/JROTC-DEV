import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useCompetitionEvents } from './hooks/useCompetitionEvents';
import { CreateEventModal } from './CreateEventModal';
import { EditEventModal } from './EditEventModal';
import { format } from 'date-fns';
export const EventsPage = () => {
  const {
    events,
    isLoading,
    deleteEvent
  } = useCompetitionEvents();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<typeof events[0] | null>(null);
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
  const handleEdit = (event: typeof events[0]) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    if (window.confirm('Are you sure you want to archive this event? It will be hidden from the list.')) {
      await deleteEvent(eventId);
    }
  };
  if (isLoading) {
    return <div className="p-6">
        <div className="text-center">Loading events...</div>
      </div>;
  }
  return (
    <TooltipProvider>
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
            {events.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No events found</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                  Create your first event
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Score Sheet</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map(event => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>{event.description || 'No description'}</TableCell>
                      <TableCell>
                        {event.score_sheet ? (
                          <Badge variant="default">Assigned</Badge>
                        ) : (
                          <Badge variant="secondary">No template</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(event.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit event</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Archive event</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <CreateEventModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
        <EditEventModal 
          open={isEditModalOpen} 
          onOpenChange={setIsEditModalOpen}
          event={selectedEvent}
        />
      </div>
    </TooltipProvider>
  );
};