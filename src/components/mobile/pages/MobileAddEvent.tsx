import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEvents } from '@/components/calendar/hooks/useEvents';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { formatInSchoolTimezone } from '@/utils/timezoneUtils';
import { TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { useToast } from '@/hooks/use-toast';

export const MobileAddEvent: React.FC = () => {
  const navigate = useNavigate();
  const { createEvent } = useEvents({ eventType: '', assignedTo: '' });
  const { timezone } = useSchoolTimezone();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    is_all_day: false,
    start_date: '',
    start_time: '',
    end_date: '',
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
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    event_type: ''
  };
  
  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData,
    currentData: formData
  });

  // Set default dates to today
  useEffect(() => {
    const today = new Date();
    const dateStr = formatInSchoolTimezone(today, TIME_FORMATS.DATE_ONLY, timezone);
    const timeStr = formatInSchoolTimezone(today, TIME_FORMATS.TIME_ONLY_24H, timezone);
    
    setFormData(prev => ({
      ...prev,
      start_date: dateStr,
      end_date: dateStr,
      start_time: timeStr,
      end_time: timeStr
    }));
  }, [timezone]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-set end date/time when start changes
    if (field === 'start_date' && !formData.end_date) {
      setFormData(prev => ({ ...prev, end_date: value }));
    }
    if (field === 'start_time' && !formData.end_time) {
      const [hours, minutes] = value.split(':');
      const endTime = `${String(parseInt(hours) + 1).padStart(2, '0')}:${minutes}`;
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
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);
      
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
      const eventData = {
        ...formData,
        start_date: formData.is_all_day 
          ? formData.start_date 
          : new Date(`${formData.start_date}T${formData.start_time}`).toISOString(),
        end_date: formData.is_all_day
          ? formData.end_date
          : new Date(`${formData.end_date}T${formData.end_time}`).toISOString(),
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
              className="h-8"
            >
              <Save size={16} className="mr-1" />
              Save
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drill">Drill Practice</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="competition">Competition</SelectItem>
                    <SelectItem value="ceremony">Ceremony</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
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
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                  />
                </div>
              </div>

              {!formData.is_all_day && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => handleInputChange('end_time', e.target.value)}
                    />
                  </div>
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