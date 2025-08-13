
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface EventFiltersProps {
  filters: {
    eventType: string;
    assignedTo: string;
  };
  onFiltersChange: (filters: { eventType: string; assignedTo: string }) => void;
}

export const EventFilters = ({
  filters,
  onFiltersChange,
}: EventFiltersProps) => {
  const handleEventTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      eventType: value === 'all' ? '' : value,
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Event Type</label>
            <Select value={filters.eventType || 'all'} onValueChange={handleEventTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="All event types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="competition">Competition</SelectItem>
                <SelectItem value="ceremony">Ceremony</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="drill">Drill</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};