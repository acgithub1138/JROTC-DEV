import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityService } from './hooks/useCommunityService';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

export const MyServiceRecordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();
  const { createRecord, isCreating } = useCommunityService();

  // Form state
  const [formData, setFormData] = useState({
    date: new Date(),
    event: '',
    hours: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) {
      toast.error('Error', {
        description: 'User profile not found. Please try logging in again.'
      });
      return;
    }

    if (!formData.event.trim()) {
      toast.error('Validation Error', {
        description: 'Event description is required.'
      });
      return;
    }

    if (!formData.hours || parseFloat(formData.hours) <= 0) {
      toast.error('Validation Error', {
        description: 'Hours must be a positive number.'
      });
      return;
    }

    try {
      await createRecord({
        cadet_id: userProfile.id,
        date: formData.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        event: formData.event.trim(),
        hours: parseFloat(formData.hours),
        notes: formData.notes.trim() || undefined
      });

      toast.success('Success', {
        description: 'Community service record created successfully!'
      });

      // Navigate back to the cadet record page or dashboard
      const returnCadetId = searchParams.get('cadet_id');
      if (returnCadetId) {
        navigate(`/app/cadets/cadet_record?mode=view&id=${returnCadetId}`);
      } else {
        navigate(`/app/cadets/cadet_record?mode=view&id=${userProfile.id}`);
      }
    } catch (error) {
      console.error('Error creating community service record:', error);
      toast.error('Error', {
        description: 'Failed to create community service record. Please try again.'
      });
    }
  };

  const handleBack = () => {
    const returnCadetId = searchParams.get('cadet_id');
    if (returnCadetId) {
      navigate(`/app/cadets/cadet_record?mode=view&id=${returnCadetId}`);
    } else if (userProfile) {
      navigate(`/app/cadets/cadet_record?mode=view&id=${userProfile.id}`);
    } else {
      navigate('/app/cadets');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!userProfile) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">
          <p>Loading user profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Add Service Hours</h1>
            <p className="text-muted-foreground">
              Record your community service hours
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Community Service Record</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Info Display */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Recording for:</p>
              <p className="font-medium">
                {userProfile.last_name}, {userProfile.first_name}
              </p>
              <p className="text-sm text-muted-foreground">{userProfile.email}</p>
            </div>

            {/* Date Field */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="date" className="text-left">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => handleInputChange('date', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Event Field */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="event" className="text-left">Event/Activity *</Label>
              <Input
                id="event"
                value={formData.event}
                onChange={(e) => handleInputChange('event', e.target.value)}
                placeholder="Description of community service activity"
                required
              />
            </div>

            {/* Hours Field */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="hours" className="text-left">Hours *</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0.5"
                value={formData.hours}
                onChange={(e) => handleInputChange('hours', e.target.value)}
                placeholder="Number of hours served"
                required
              />
            </div>

            {/* Notes Field */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="notes" className="text-left">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional details about your service"
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isCreating}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                {isCreating ? 'Recording...' : 'Record Service Hours'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};