import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCompetitionResources } from '@/hooks/competition-portal/useCompetitionResources';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { MobileDateTimePicker } from '@/components/mobile/ui/MobileDateTimePicker';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const MobileEditResource: React.FC = () => {
  const navigate = useNavigate();
  const { competitionId, resourceId } = useParams<{ competitionId: string; resourceId: string }>();
  const { resources, updateResource, deleteResource } = useCompetitionResources(competitionId);
  const { users, isLoading: usersLoading } = useSchoolUsers(true);
  const { timezone } = useSchoolTimezone();
  
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find the current resource
  const currentResource = resources.find(r => r.id === resourceId);

  const initialFormData = {
    resource: currentResource?.resource || '',
    location: currentResource?.location || '',
    start_date: currentResource?.start_time ? new Date(currentResource.start_time) : new Date(),
    start_time: currentResource?.start_time ? format(new Date(currentResource.start_time), 'HH:mm') : '08:00',
    end_date: currentResource?.end_time ? new Date(currentResource.end_time) : new Date(),
    end_time: currentResource?.end_time ? format(new Date(currentResource.end_time), 'HH:mm') : '09:00',
    assignment_details: currentResource?.assignment_details || ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: formData,
    enabled: true
  });

  // Update form data when resource loads
  useEffect(() => {
    if (currentResource) {
      const newFormData = {
        resource: currentResource.resource || '',
        location: currentResource.location || '',
        start_date: currentResource.start_time ? new Date(currentResource.start_time) : new Date(),
        start_time: currentResource.start_time ? format(new Date(currentResource.start_time), 'HH:mm') : '08:00',
        end_date: currentResource.end_time ? new Date(currentResource.end_time) : new Date(),
        end_time: currentResource.end_time ? format(new Date(currentResource.end_time), 'HH:mm') : '09:00',
        assignment_details: currentResource.assignment_details || ''
      };
      setFormData(newFormData);
    }
  }, [currentResource]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-set end time when start time changes (add 1 hour)
      if (field === 'start_time' && value) {
        const [hours, minutes] = value.split(':').map(Number);
        let endHour = hours + 1;
        let endDate = newData.end_date;
        
        // Handle day overflow
        if (endHour >= 24) {
          endHour = endHour - 24;
          if (newData.start_date) {
            const nextDay = new Date(newData.start_date);
            nextDay.setDate(nextDay.getDate() + 1);
            endDate = nextDay;
          }
        } else {
          // Keep same date if no overflow
          endDate = newData.start_date;
        }
        
        newData.end_time = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        newData.end_date = endDate;
      }
      
      return newData;
    });
  };

  const handleSubmit = async () => {
    if (!formData.resource) {
      toast.error('Please select a cadet');
      return;
    }

    if (!resourceId) return;

    setIsSubmitting(true);
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

      await updateResource(resourceId, {
        resource: formData.resource,
        location: formData.location || undefined,
        assignment_details: formData.assignment_details || undefined,
        start_time: startTime || undefined,
        end_time: endTime || undefined
      });

      resetChanges();
      navigate(`/mobile/competition-portal/manage/${competitionId}/resources`);
    } catch (error) {
      console.error('Error updating resource:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!resourceId) return;

    try {
      await deleteResource(resourceId);
      navigate(`/mobile/competition-portal/manage/${competitionId}/resources`);
    } catch (error) {
      console.error('Error deleting resource:', error);
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

  if (!currentResource) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(`/mobile/competition-portal/manage/${competitionId}/resources`)}
            className="mr-3 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Resource Not Found</h1>
        </div>
        <p className="text-muted-foreground">The requested resource could not be found.</p>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-foreground">Edit Resource</h1>
            <p className="text-sm text-muted-foreground">Update resource assignment details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowDeleteDialog(true)}
            className="h-8 w-8 p-0"
          >
            <Trash2 size={16} />
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="h-8 w-8 p-0"
          >
            <Save size={16} />
          </Button>
        </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-background border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resource assignment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleCancelDiscard}
      />
    </div>
  );
};
