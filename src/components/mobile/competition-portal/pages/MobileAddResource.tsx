import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useCompetitionResources } from '@/hooks/competition-portal/useCompetitionResources';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { supabase } from '@/integrations/supabase/client';
import { MobileDateTimePicker } from '@/components/mobile/ui/MobileDateTimePicker';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const MobileAddResource: React.FC = () => {
  const navigate = useNavigate();
  const { competitionId } = useParams<{ competitionId: string }>();
  const { createResource } = useCompetitionResources(competitionId);
  const { users, isLoading: usersLoading } = useSchoolUsers(true);
  const { timezone, isLoading: timezoneLoading } = useSchoolTimezone();
  
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const initialFormData = {
    resource: '',
    location: '',
    start_date: new Date(),
    start_time: '08:00',
    end_date: new Date(),
    end_time: '09:00',
    assignment_details: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: formData,
    enabled: true
  });

  useEffect(() => {
    fetchCompetitionDate();
  }, [competitionId, timezoneLoading]);

  const fetchCompetitionDate = async () => {
    if (!competitionId || timezoneLoading) return;
    
    try {
      const { data, error } = await supabase
        .from('cp_competitions')
        .select('start_date, end_date')
        .eq('id', competitionId)
        .single();

      if (error) throw error;

      if (data?.start_date) {
        const startDate = new Date(data.start_date);
        const endDate = data?.end_date ? new Date(data.end_date) : startDate;
        
        setFormData(prev => ({
          ...prev,
          start_date: startDate,
          end_date: endDate
        }));
      }
    } catch (error) {
      console.error('Error fetching competition date:', error);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-set end date when start date changes and end date is not set
      if (field === 'start_date' && value && !newData.end_date) {
        newData.end_date = value;
      }
      
      return newData;
    });
  };

  const handleSubmit = async () => {
    if (!formData.resource) {
      toast.error('Please select a cadet');
      return;
    }

    try {
      let startTime = null;
      let endTime = null;

      // Build start time if date and time are provided
      if (formData.start_date && formData.start_time) {
        const startDateStr = format(formData.start_date, 'yyyy-MM-dd');
        const startDateTime = new Date(`${startDateStr}T${formData.start_time}:00`);
        startTime = startDateTime.toISOString();
      }

      // Build end time if date and time are provided
      if (formData.end_date && formData.end_time) {
        const endDateStr = format(formData.end_date, 'yyyy-MM-dd');
        const endDateTime = new Date(`${endDateStr}T${formData.end_time}:00`);
        endTime = endDateTime.toISOString();
      }

      await createResource({
        resource: formData.resource,
        location: formData.location || undefined,
        assignment_details: formData.assignment_details || undefined,
        competition_id: competitionId!,
        start_time: startTime || undefined,
        end_time: endTime || undefined
      } as any);

      resetChanges();
      navigate(`/mobile/competition-portal/manage/${competitionId}/resources`);
    } catch (error) {
      console.error('Error creating resource:', error);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate(`/mobile/competition-portal/manage/${competitionId}/resources`);
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    navigate(`/mobile/competition-portal/manage/${competitionId}/resources`);
  };

  const handleCancelDiscard = () => {
    setShowUnsavedDialog(false);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add Resource</h1>
            <p className="text-sm text-muted-foreground">Assign a new resource to the competition</p>
          </div>
        </div>
        <Button onClick={handleSubmit} className="h-8 w-8 p-0">
          <Save size={16} />
        </Button>
      </div>

      {/* Form */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Resource Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cadet Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Cadet *</label>
            <Select 
              value={formData.resource} 
              onValueChange={(value) => updateFormData('resource', value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={usersLoading ? "Loading users..." : "Select a cadet"} />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border">
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id} className="hover:bg-accent">
                    {user.last_name}, {user.first_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Location</label>
            <Input
              value={formData.location}
              onChange={(e) => updateFormData('location', e.target.value)}
              placeholder="Enter location"
              className="bg-background"
            />
          </div>

          {/* Start Date & Time */}
          <MobileDateTimePicker
            dateValue={formData.start_date}
            timeValue={formData.start_time}
            onDateChange={(date) => updateFormData('start_date', date)}
            onTimeChange={(time) => updateFormData('start_time', time)}
            dateLabel="Start Date"
            timeLabel="Start Time"
            dateId="start_date"
            timeId="start_time"
            className="space-y-2"
          />

          {/* End Date & Time */}
          <MobileDateTimePicker
            dateValue={formData.end_date}
            timeValue={formData.end_time}
            onDateChange={(date) => updateFormData('end_date', date)}
            onTimeChange={(time) => updateFormData('end_time', time)}
            dateLabel="End Date"
            timeLabel="End Time"
            dateId="end_date"
            timeId="end_time"
            className="space-y-2"
          />

          {/* Assignment Details */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Assignment Details</label>
            <Textarea
              value={formData.assignment_details}
              onChange={(e) => updateFormData('assignment_details', e.target.value)}
              placeholder="Enter assignment details"
              className="bg-background min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleCancelDiscard}
      />
    </div>
  );
};