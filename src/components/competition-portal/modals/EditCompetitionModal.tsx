import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
interface Competition {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: string;
  max_participants?: number;
  registration_deadline?: string;
  registered_schools: string[];
  status: string;
  is_public: boolean;
  school_id: string;
  created_at: string;
  created_by?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}
interface EditCompetitionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competition: Competition | null;
  onSubmit: (data: any) => Promise<void>;
}
export const EditCompetitionModal: React.FC<EditCompetitionModalProps> = ({
  open,
  onOpenChange,
  competition,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    start_date: '',
    end_date: '',
    start_time_hour: '09',
    start_time_minute: '00',
    end_time_hour: '17',
    end_time_minute: '00',
    max_participants: '',
    registration_deadline: '',
    is_public: true
  });
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [registrationDeadline, setRegistrationDeadline] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  React.useEffect(() => {
    if (competition) {
      const startDate = competition.start_date ? new Date(competition.start_date) : null;
      const endDate = competition.end_date ? new Date(competition.end_date) : null;
      setFormData({
        name: competition.name || '',
        description: competition.description || '',
        location: competition.location || '',
        address: competition.address || '',
        city: competition.city || '',
        state: competition.state || '',
        zip: competition.zip || '',
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : '',
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : '',
        start_time_hour: startDate ? format(startDate, 'HH') : '09',
        start_time_minute: startDate ? format(startDate, 'mm') : '00',
        end_time_hour: endDate ? format(endDate, 'HH') : '17',
        end_time_minute: endDate ? format(endDate, 'mm') : '00',
        max_participants: competition.max_participants?.toString() || '',
        registration_deadline: competition.registration_deadline || '',
        is_public: competition.is_public
      });
      setStartDate(startDate || undefined);
      setEndDate(endDate || undefined);
      setRegistrationDeadline(competition.registration_deadline ? new Date(competition.registration_deadline) : undefined);
    }
  }, [competition]);
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleDateChange = (field: 'start_date' | 'end_date' | 'registration_deadline', dateValue: string) => {
    if (field === 'registration_deadline') {
      const date = dateValue ? new Date(dateValue) : undefined;
      setRegistrationDeadline(date);
      setFormData(prev => ({
        ...prev,
        registration_deadline: date ? date.toISOString() : ''
      }));
      return;
    }

    // For start_date and end_date, combine with current time
    if (dateValue) {
      const timeHour = field === 'start_date' ? formData.start_time_hour : formData.end_time_hour;
      const timeMinute = field === 'start_date' ? formData.start_time_minute : formData.end_time_minute;
      const combinedDateTime = new Date(`${dateValue}T${timeHour}:${timeMinute}:00`);
      const isoString = combinedDateTime.toISOString();
      
      setFormData(prev => ({
        ...prev,
        [field]: isoString
      }));
      
      if (field === 'start_date') setStartDate(new Date(dateValue));
      if (field === 'end_date') setEndDate(new Date(dateValue));
    }
  };

  const handleTimeChange = (field: 'start_time_hour' | 'start_time_minute' | 'end_time_hour' | 'end_time_minute', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Update the corresponding date with the new time
    const isStartTime = field.startsWith('start_time');
    const dateField = isStartTime ? 'start_date' : 'end_date';
    const currentDate = isStartTime ? startDate : endDate;
    
    if (currentDate) {
      const timeHour = field === 'start_time_hour' ? value : 
                     field === 'end_time_hour' ? value :
                     isStartTime ? formData.start_time_hour : formData.end_time_hour;
      const timeMinute = field === 'start_time_minute' ? value :
                        field === 'end_time_minute' ? value :
                        isStartTime ? formData.start_time_minute : formData.end_time_minute;
      
      const combinedDateTime = new Date(`${format(currentDate, 'yyyy-MM-dd')}T${timeHour}:${timeMinute}:00`);
      setFormData(prev => ({
        ...prev,
        [dateField]: combinedDateTime.toISOString()
      }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.start_date || !formData.end_date) {
      return;
    }
    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        registration_deadline: formData.registration_deadline || null
      };
      await onSubmit(submitData);
    } finally {
      setIsSubmitting(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Competition</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Competition Name *</Label>
              <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="Enter competition name" required />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="Enter competition description" className="min-h-20" />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input id="location" value={formData.location} onChange={e => handleInputChange('location', e.target.value)} placeholder="Enter location" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} placeholder="Street address" />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={formData.city} onChange={e => handleInputChange('city', e.target.value)} placeholder="City" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" value={formData.state} onChange={e => handleInputChange('state', e.target.value)} placeholder="State" />
              </div>
              <div>
                <Label htmlFor="zip">ZIP Code</Label>
                <Input id="zip" value={formData.zip} onChange={e => handleInputChange('zip', e.target.value)} placeholder="ZIP code" />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date ? format(new Date(formData.start_date), 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDateChange('start_date', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date ? format(new Date(formData.end_date), 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDateChange('end_date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Select value={formData.start_time_hour} onValueChange={(value) => handleTimeChange('start_time_hour', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select value={formData.start_time_minute} onValueChange={(value) => handleTimeChange('start_time_minute', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {['00', '10', '20', '30', '40', '50'].map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            {minute}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label>End Time</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Select value={formData.end_time_hour} onValueChange={(value) => handleTimeChange('end_time_hour', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select value={formData.end_time_minute} onValueChange={(value) => handleTimeChange('end_time_minute', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {['00', '10', '20', '30', '40', '50'].map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            {minute}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="registration_deadline">Registration Deadline</Label>
              <Input
                id="registration_deadline"
                type="date"
                value={formData.registration_deadline ? format(new Date(formData.registration_deadline), 'yyyy-MM-dd') : ''}
                onChange={(e) => handleDateChange('registration_deadline', e.target.value)}
              />
            </div>
          </div>

          {/* Participants */}
          <div>
            <Label htmlFor="max_participants">Max Participants</Label>
            <Input id="max_participants" type="number" value={formData.max_participants} onChange={e => handleInputChange('max_participants', e.target.value)} placeholder="Enter maximum number of participants" min="1" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Competition'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
};