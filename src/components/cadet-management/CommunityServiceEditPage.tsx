import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCommunityService } from './hooks/useCommunityService';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { Skeleton } from '@/components/ui/skeleton';

export const CommunityServiceEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [date, setDate] = useState<Date | undefined>();
  const [event, setEvent] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [cadetName, setCadetName] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<any>(null);

  const { records, updateRecord, isUpdating, isLoading } = useCommunityService();

  // Find the record to edit
  const record = records.find(r => r.id === id);

  // Load record data
  useEffect(() => {
    if (record) {
      const recordDate = new Date(record.date);
      setDate(recordDate);
      setEvent(record.event);
      setHours(record.hours.toString());
      setNotes(record.notes || '');
      setCadetName(`${record.cadet.last_name}, ${record.cadet.first_name}${record.cadet.grade ? ` (${record.cadet.grade})` : ''}`);
      
      // Store initial data for comparison
      setInitialData({
        date: recordDate,
        event: record.event,
        hours: record.hours.toString(),
        notes: record.notes || ''
      });
    }
  }, [record]);

  // Track changes for unsaved dialog
  useEffect(() => {
    if (initialData) {
      const hasChanges = 
        date?.toISOString().split('T')[0] !== initialData.date?.toISOString().split('T')[0] ||
        event !== initialData.event ||
        hours !== initialData.hours ||
        notes !== initialData.notes;
      setHasUnsavedChanges(hasChanges);
    }
  }, [date, event, hours, notes, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !event || !hours || !record) {
      return;
    }
    
    const updateData = {
      id: record.id,
      cadet_id: record.cadet_id,
      date: date.toISOString().split('T')[0],
      event: event.trim(),
      hours: parseFloat(hours),
      notes: notes.trim() || undefined
    };

    updateRecord(updateData);
    setHasUnsavedChanges(false);
    navigate(-1);
  };

  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowUnsavedDialog(true);
    } else {
      navigate(path);
    }
  };

  const handleDiscardChanges = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedDialog(false);
    if (pendingNavigation === 'back') {
      navigate(-1);
    } else if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setPendingNavigation(null);
  };

  const handleCancelNavigation = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-6 w-64 mb-1" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold mb-2">Record Not Found</h1>
          <p className="text-muted-foreground mb-4">The community service record you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(-1)}>
            Back to Cadets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (hasUnsavedChanges) {
                setPendingNavigation('back');
                setShowUnsavedDialog(true);
              } else {
                navigate(-1);
              }
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cadets
          </Button>
        </div>
        <h1 className="text-2xl font-bold">Edit Community Service Record</h1>
        <p className="text-muted-foreground mt-1">
          Update the community service record details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Community Service Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cadet">Cadet</Label>
                  <div className="p-2 bg-muted rounded-md">
                    {cadetName}
                  </div>
                </div>

                <div>
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar 
                        mode="single" 
                        selected={date} 
                        onSelect={setDate} 
                        initialFocus 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="event">Activity/Event *</Label>
                  <Input
                    id="event"
                    value={event}
                    onChange={(e) => setEvent(e.target.value)}
                    placeholder="e.g., Food bank volunteer, Park cleanup"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="hours">Hours *</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="0.0"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Event Description</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add details about the event..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end sm:space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  if (hasUnsavedChanges) {
                    setPendingNavigation('back');
                    setShowUnsavedDialog(true);
                  } else {
                    navigate(-1);
                  }
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isUpdating}
                className="w-full sm:w-auto"
              >
                {isUpdating ? 'Updating...' : 'Update Record'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleCancelNavigation}
      />
    </div>
  );
};