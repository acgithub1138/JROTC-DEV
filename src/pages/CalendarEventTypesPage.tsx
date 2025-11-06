import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import EventTypesManagement from '@/components/event-types/EventTypesManagement';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePermissionContext } from '@/contexts/PermissionContext';

const CalendarEventTypesPageContent: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { hasPermission } = usePermissionContext();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar Event Types</h1>
          <p className="text-muted-foreground mt-1">
            Manage event types and their associated colors for the calendar system
          </p>
        </div>
        {hasPermission('cal_event_types', 'create') && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Event Type
          </Button>
        )}
      </div>
      <EventTypesManagement 
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    </div>
  );
};

const CalendarEventTypesPage: React.FC = () => {
  return (
    <ProtectedRoute module="cal_event_types" requirePermission="read">
      <CalendarEventTypesPageContent />
    </ProtectedRoute>
  );
};

export default CalendarEventTypesPage;
