import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddressLookupField } from '@/components/calendar/components/AddressLookupField';
import { supabase } from '@/integrations/supabase/client';
import { Competition } from '../types';
import { JROTC_PROGRAM_OPTIONS } from '../utils/constants';
import type { Database } from '@/integrations/supabase/types';

type DatabaseCompetition = Database['public']['Tables']['competitions']['Row'];

interface CompetitionFormProps {
  competition?: Competition | DatabaseCompetition | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  onFormInteraction?: () => void;
}

export const CompetitionForm: React.FC<CompetitionFormProps> = ({
  competition,
  onSubmit,
  onCancel,
  onFormInteraction
}) => {
  const [formData, setFormData] = useState({
    name: competition?.name || '',
    description: competition?.description || '',
    location: competition?.location || '',
    competition_date: competition?.competition_date ? new Date(competition.competition_date).toISOString().split('T')[0] : '',
    comp_type: (competition as any)?.comp_type || 'air_force',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      // Submit only the fields that exist in the competitions table
      const submissionData = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        competition_date: formData.competition_date,
        comp_type: formData.comp_type,
      };
      
      await onSubmit(submissionData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onFormInteraction?.(); // Notify parent of form interaction
  };

  const handleLocationSelect = (selectedLocation: string) => {
    updateFormData('location', selectedLocation);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Competition Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="comp_type">JROTC Program *</Label>
          <Select value={formData.comp_type} onValueChange={(value) => updateFormData('comp_type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select JROTC Program" />
            </SelectTrigger>
            <SelectContent>
              {JROTC_PROGRAM_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <div className="space-y-2">
         <Label htmlFor="competition_date">Competition Date *</Label>
         <Input
           id="competition_date"
           type="date"
           value={formData.competition_date}
           onChange={(e) => updateFormData('competition_date', e.target.value)}
           required
         />
       </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location Search</Label>
        <AddressLookupField
          value={formData.location}
          onValueChange={handleLocationSelect}
          placeholder="Search for a location"
        />
      </div>       
     </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => updateFormData('description', e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (competition ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
};