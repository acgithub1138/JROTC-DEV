import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimePicker } from '@/components/ui/time-picker';
import { useEventTypes } from '@/components/calendar/hooks/useEventTypes';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useEvents } from '@/components/calendar/hooks/useEvents';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const MobileAddEvent: React.FC = () => {
  const navigate = useNavigate();
  const { createEvent } = useEvents({ eventType: '', assignedTo: '' });
  const { eventTypes, isLoading: eventTypesLoading } = useEventTypes();
  const { timezone } = useSchoolTimezone();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    is_all_day: false,
    start_date: new Date(),
    start_time: '',
    end_date: new Date(),
    end_time: '',
    event_type: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  
  const initialData = {
    title: '',
    description: '',
    location: '',
    is_all_day: false,
    start_date: new Date(),
    start_time: '',
    end_date: new Date(),
    end_time: '',
    event_type: ''
  };
  
  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData,
    currentData: formData
  });

  // Set default dates and times
  useEffect(() => {
    const today = new Date();
    const defaultStartTime = '08:00';
    const defaultEndTime = '09:00';
    
    setFormData(prev => ({
      ...prev,
      start_date: today,
      end_date: today,
      start_time: defaultStartTime,
      end_time: defaultEndTime
    }));
  }, [timezone]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-set end date/time when start changes
    if (field === 'start_date') {
      setFormData(prev => ({ ...prev, end_date: value }));
    }
    if (field === 'start_time') {
      const [hours, minutes] = value.split(':');
      const nextHour = (parseInt(hours) + 1) % 24;
      const endTime = `${String(nextHour).padStart(2, '0')}:${minutes}`;
      setFormData(prev => ({ ...prev, end_time: endTime }));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Event title is required',
        variant: 'destructive',
      });
      return false;
    }
    
    if (!formData.is_all_day) {
      const startDate = format(formData.start_date, 'yyyy-MM-dd');
      const endDate = format(formData.end_date, 'yyyy-MM-dd');
      const startDateTime = new Date(`${startDate}T${formData.start_time}`);
      const endDateTime = new Date(`${endDate}T${formData.end_time}`);
      
      if (endDateTime <= startDateTime) {
        toast({
          title: 'Error',
          description: 'End date/time must be after start date/time',
          variant: 'destructive',
        });
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const startDateStr = format(formData.start_date, 'yyyy-MM-dd');
      const endDateStr = format(formData.end_date, 'yyyy-MM-dd');
      
      const eventData = {
        ...formData,
        start_date: formData.is_all_day 
          ? startDateStr 
          : new Date(`${startDateStr}T${formData.start_time}`).toISOString(),
        end_date: formData.is_all_day
          ? endDateStr
          : new Date(`${endDateStr}T${formData.end_time}`).toISOString(),
      };
      
      // Remove time fields for submission
      const { start_time, end_time, ...submitData } = eventData;
      
      await createEvent(submitData);
      resetChanges();
      navigate('/mobile/calendar');
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate('/mobile/calendar');
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    navigate('/mobile/calendar');
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-2 h-8 w-8"
              >
                <ArrowLeft size={18} />
              </Button>
              <h1 className="text-lg font-semibold text-foreground">
                Add Event
              </h1>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.title.trim()}
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Save size={16} />
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 space-y-4 pb-20">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter event title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter event description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter event location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type</Label>
                <Select value={formData.event_type} onValueChange={(value) => handleInputChange('event_type', value)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={eventTypesLoading ? "Loading event types..." : "Select event type"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    {eventTypes.map((eventType) => (
                      <SelectItem key={eventType.id} value={eventType.id} className="hover:bg-accent">
                        {eventType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="all-day">All Day Event</Label>
                <Switch
                  id="all-day"
                  checked={formData.is_all_day}
                  onCheckedChange={(checked) => handleInputChange('is_all_day', checked)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.start_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date ? format(formData.start_date, "MM/dd/yyyy") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) => date && handleInputChange('start_date', date)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.end_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.end_date ? format(formData.end_date, "MM/dd/yyyy") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.end_date}
                        onSelect={(date) => date && handleInputChange('end_date', date)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {!formData.is_all_day && (
                <div className="grid grid-cols-2 gap-4">
                  <TimePicker
                    id="start_time"
                    label="Start Time"
                    value={formData.start_time}
                    onChange={(value) => handleInputChange('start_time', value)}
                  />
                  <TimePicker
                    id="end_time"
                    label="End Time"
                    value={formData.end_time}
                    onChange={(value) => handleInputChange('end_time', value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </>
  );
};