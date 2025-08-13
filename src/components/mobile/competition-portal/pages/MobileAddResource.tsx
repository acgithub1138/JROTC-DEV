import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useCompetitionResources } from '@/hooks/competition-portal/useCompetitionResources';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { supabase } from '@/integrations/supabase/client';
import { formatInSchoolTimezone } from '@/utils/timezoneUtils';
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
    start_date: '',
    start_time_hour: '09',
    start_time_minute: '00',
    end_date: '',
    end_time_hour: '10',
    end_time_minute: '00',
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
        const startDate = formatInSchoolTimezone(data.start_date, 'yyyy-MM-dd', timezone);
        const endDate = data?.end_date ? formatInSchoolTimezone(data.end_date, 'yyyy-MM-dd', timezone) : startDate;
        
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

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-update logic for time fields
      if (field === 'start_date' && value && !prev.end_date) {
        newData.end_date = value;
      }
      
      if (field === 'start_time_hour' || field === 'start_time_minute') {
        const startHour = parseInt(field === 'start_time_hour' ? value : prev.start_time_hour || '0');
        const startMinute = parseInt(field === 'start_time_minute' ? value : prev.start_time_minute || '0');
        let endHour = startHour + 1;
        let endMinute = startMinute;
        
        if (endHour >= 24) {
          endHour = 0;
          // If we overflow to the next day, update the end date too
          if (prev.start_date) {
            const nextDay = new Date(prev.start_date);
            nextDay.setDate(nextDay.getDate() + 1);
            newData.end_date = nextDay.toISOString().split('T')[0];
          }
        } else {
          // Make sure end date matches start date
          if (prev.start_date) {
            newData.end_date = prev.start_date;
          }
        }
        
        newData.end_time_hour = endHour.toString().padStart(2, '0');
        newData.end_time_minute = endMinute.toString().padStart(2, '0');
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
      if (formData.start_date && formData.start_time_hour && formData.start_time_minute) {
        const startDateTime = new Date(`${formData.start_date}T${formData.start_time_hour}:${formData.start_time_minute}:00`);
        startTime = startDateTime.toISOString();
      }

      // Build end time if date and time are provided
      if (formData.end_date && formData.end_time_hour && formData.end_time_minute) {
        const endDateTime = new Date(`${formData.end_date}T${formData.end_time_hour}:${formData.end_time_minute}:00`);
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Start Date & Time</label>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2">
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => updateFormData('start_date', e.target.value)}
                  className="bg-background"
                />
              </div>
              <div>
                <Select 
                  value={formData.start_time_hour} 
                  onValueChange={(value) => updateFormData('start_time_hour', value)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border max-h-60">
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString().padStart(2, '0')} className="hover:bg-accent">
                        {i.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select 
                  value={formData.start_time_minute} 
                  onValueChange={(value) => updateFormData('start_time_minute', value)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    {['00', '10', '20', '30', '40', '50'].map((minute) => (
                      <SelectItem key={minute} value={minute} className="hover:bg-accent">
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* End Date & Time */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">End Date & Time</label>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2">
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => updateFormData('end_date', e.target.value)}
                  className="bg-background"
                />
              </div>
              <div>
                <Select 
                  value={formData.end_time_hour} 
                  onValueChange={(value) => updateFormData('end_time_hour', value)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border max-h-60">
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString().padStart(2, '0')} className="hover:bg-accent">
                        {i.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select 
                  value={formData.end_time_minute} 
                  onValueChange={(value) => updateFormData('end_time_minute', value)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    {['00', '10', '20', '30', '40', '50'].map((minute) => (
                      <SelectItem key={minute} value={minute} className="hover:bg-accent">
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

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