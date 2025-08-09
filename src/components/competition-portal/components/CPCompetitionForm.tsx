import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddressLookupField } from '@/components/calendar/components/AddressLookupField';
import { useAuth } from '@/contexts/AuthContext';

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
  const { userProfile } = useAuth();
  
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
    hosting_school: competition?.hosting_school || userProfile?.schools?.name || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // When start date is set, automatically set end date and registration deadline
      if (field === 'start_date' && value) {
        const startDate = new Date(value);
        
        // Set end date to same as start date
        newData.end_date = value;
        
        // Set registration deadline to 7 days before start date at 18:00
        const registrationDeadline = new Date(startDate);
        registrationDeadline.setDate(registrationDeadline.getDate() - 7);
        newData.registration_deadline_date = registrationDeadline.toISOString().split('T')[0];
        newData.registration_deadline_hour = '18';
        newData.registration_deadline_minute = '00';
      }
      
      return newData;
    });
    onInteraction?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // Parse location to extract address components if not already filled
      let addressData = {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip
      };

      // If address fields are empty but location is provided, try to parse location
        if (!formData.address && !formData.city && !formData.state && !formData.zip && formData.location) {
          const rawParts = formData.location.split(',').map((p) => p.trim()).filter(Boolean);

          // Remove trailing country if present (e.g., USA, United States)
          const countryPattern = /^(usa|us|united states|united states of america)$/i;
          const parts = [...rawParts];
          if (parts.length > 0 && countryPattern.test(parts[parts.length - 1])) {
            parts.pop();
          }

          if (parts.length >= 2) {
            // Detect street part (often the first part with digits). If first part has no digits
            // and second does, it's likely a place name followed by the street.
            let streetIdx = 0;
            if (parts.length >= 3 && !/\d/.test(parts[0]) && /\d/.test(parts[1])) {
              streetIdx = 1;
            }

            // Assign address and city when possible
            addressData.address = parts[streetIdx] || '';
            addressData.city = parts[streetIdx + 1] || '';

            // State and ZIP typically live in the next segment
            const stateZipPart = parts[streetIdx + 2] || '';
            if (stateZipPart) {
              // Match: "TX 75098" or "Texas 75098" or just "TX" / "Texas"
              const m = stateZipPart.match(/^([A-Za-z]{2}|[A-Za-z][A-Za-z\s]+)\s*(\d{5}(?:-\d{4})?)?$/);
              if (m) {
                addressData.state = (m[1] || '').trim();
                if (m[2]) addressData.zip = m[2];
              } else {
                // Sometimes ZIP may be a separate trailing part (rare)
                const last = parts[streetIdx + 3];
                const zipOnly = last && last.match(/^(\d{5}(?:-\d{4})?)$/);
                if (zipOnly) {
                  addressData.state = stateZipPart;
                  addressData.zip = zipOnly[1];
                } else {
                  addressData.state = stateZipPart;
                }
              }
            }

            // If after parsing, we still don't have a street but we do have at least 3 parts,
            // fall back to the simpler mapping: [0]=street, [1]=city, [last]=state/zip
            if (!addressData.address && parts.length >= 3) {
              addressData.address = parts[0];
              addressData.city = parts[1] || '';
              const lastPart = parts[parts.length - 1];
              const m2 = lastPart.match(/^([A-Za-z]{2}|[A-Za-z][A-Za-z\s]+)\s*(\d{5}(?:-\d{4})?)?$/);
              if (m2) {
                addressData.state = (m2[1] || '').trim();
                if (m2[2]) addressData.zip = m2[2];
              } else {
                addressData.state = lastPart;
              }
            }
          }
        }
      
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
        address: addressData.address,
        city: addressData.city,
        state: addressData.state,
        zip: addressData.zip,
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
        <AddressLookupField
          value={formData.location}
          onValueChange={(value) => updateFormData('location', value)}
          placeholder="Enter competition location or search address"
        />
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