import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CPCompetitionFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  onInteraction?: () => void;
  competition?: any;
}

export const CPCompetitionForm: React.FC<CPCompetitionFormProps> = ({
  onSubmit,
  onCancel,
  onInteraction,
  competition
}) => {
  const [formData, setFormData] = useState({
    name: competition?.name || '',
    description: competition?.description || '',
    location: competition?.location || '',
    start_date: competition?.start_date ? new Date(competition.start_date).toISOString().split('T')[0] : '',
    start_time_hour: competition?.start_date ? new Date(competition.start_date).getHours().toString().padStart(2, '0') : '09',
    start_time_minute: competition?.start_date ? new Date(competition.start_date).getMinutes().toString().padStart(2, '0') : '00',
    end_date: competition?.end_date ? new Date(competition.end_date).toISOString().split('T')[0] : '',
    end_time_hour: competition?.end_date ? new Date(competition.end_date).getHours().toString().padStart(2, '0') : '17',
    end_time_minute: competition?.end_date ? new Date(competition.end_date).getMinutes().toString().padStart(2, '0') : '00',
    program: competition?.program || 'air_force',
    fee: competition?.fee?.toString() || '',
    address: competition?.address || '',
    city: competition?.city || '',
    state: competition?.state || '',
    zip: competition?.zip || '',
    max_participants: competition?.max_participants?.toString() || '',
    registration_deadline_date: competition?.registration_deadline ? new Date(competition.registration_deadline).toISOString().split('T')[0] : '',
    registration_deadline_hour: competition?.registration_deadline ? new Date(competition.registration_deadline).getHours().toString().padStart(2, '0') : '23',
    registration_deadline_minute: competition?.registration_deadline ? new Date(competition.registration_deadline).getMinutes().toString().padStart(2, '0') : '59',
    hosting_school: competition?.hosting_school || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onInteraction?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // Combine date and time fields into datetime strings
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time_hour}:${formData.start_time_minute}:00`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time_hour}:${formData.end_time_minute}:00`);
      const registrationDeadline = formData.registration_deadline_date 
        ? new Date(`${formData.registration_deadline_date}T${formData.registration_deadline_hour}:${formData.registration_deadline_minute}:00`)
        : null;

      // Submit data that matches cp_competitions schema
      const submissionData = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        program: formData.program,
        fee: formData.fee ? parseFloat(formData.fee) : null,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        registration_deadline: registrationDeadline ? registrationDeadline.toISOString() : null,
        hosting_school: formData.hosting_school,
      };
      
      await onSubmit(submissionData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Competition Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          placeholder="Enter competition name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Enter competition description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="program">JROTC Program *</Label>
        <Select value={formData.program} onValueChange={(value) => updateFormData('program', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select JROTC Program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="air_force">Air Force JROTC</SelectItem>
            <SelectItem value="army">Army JROTC</SelectItem>
            <SelectItem value="navy">Navy JROTC</SelectItem>
            <SelectItem value="marine_corps">Marine Corps JROTC</SelectItem>
            <SelectItem value="coast_guard">Coast Guard JROTC</SelectItem>
            <SelectItem value="space_force">Space Force JROTC</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Start Date & Time *</Label>
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-2">
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => updateFormData('start_date', e.target.value)}
                required
              />
            </div>
            <div>
              <Select value={formData.start_time_hour} onValueChange={(value) => updateFormData('start_time_hour', value)}>
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
              <Select value={formData.start_time_minute} onValueChange={(value) => updateFormData('start_time_minute', value)}>
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
          <Label>End Date & Time *</Label>
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-2">
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => updateFormData('end_date', e.target.value)}
                required
              />
            </div>
            <div>
              <Select value={formData.end_time_hour} onValueChange={(value) => updateFormData('end_time_hour', value)}>
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
              <Select value={formData.end_time_minute} onValueChange={(value) => updateFormData('end_time_minute', value)}>
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

      <div className="space-y-2">
        <Label htmlFor="location">Location *</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => updateFormData('location', e.target.value)}
          placeholder="Enter competition location"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => updateFormData('address', e.target.value)}
          placeholder="Street address"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => updateFormData('city', e.target.value)}
            placeholder="City"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => updateFormData('state', e.target.value)}
            placeholder="State"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip">ZIP Code</Label>
          <Input
            id="zip"
            value={formData.zip}
            onChange={(e) => updateFormData('zip', e.target.value)}
            placeholder="ZIP"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hosting_school">Hosting School</Label>
        <Input
          id="hosting_school"
          value={formData.hosting_school}
          onChange={(e) => updateFormData('hosting_school', e.target.value)}
          placeholder="Hosting school name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fee">Entry Fee</Label>
          <Input
            id="fee"
            type="number"
            step="0.01"
            min="0"
            value={formData.fee}
            onChange={(e) => updateFormData('fee', e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_participants">Max Participants</Label>
          <Input
            id="max_participants"
            type="number"
            min="1"
            value={formData.max_participants}
            onChange={(e) => updateFormData('max_participants', e.target.value)}
            placeholder="Unlimited"
          />
        </div>
      </div>

      <div>
        <Label>Registration Deadline</Label>
        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-2">
            <Input
              type="date"
              value={formData.registration_deadline_date}
              onChange={(e) => updateFormData('registration_deadline_date', e.target.value)}
            />
          </div>
          <div>
            <Select value={formData.registration_deadline_hour} onValueChange={(value) => updateFormData('registration_deadline_hour', value)}>
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
            <Select value={formData.registration_deadline_minute} onValueChange={(value) => updateFormData('registration_deadline_minute', value)}>
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

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : competition ? 'Update Competition' : 'Create Competition'}
        </Button>
      </div>
    </form>
  );
};