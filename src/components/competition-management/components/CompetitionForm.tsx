import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddressLookupField } from '@/components/calendar/components/AddressLookupField';
import { Competition } from '../types';
import type { Database } from '@/integrations/supabase/types';

type DatabaseCompetition = Database['public']['Tables']['competitions']['Row'];

interface CompetitionFormProps {
  competition?: Competition | DatabaseCompetition | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const CompetitionForm: React.FC<CompetitionFormProps> = ({
  competition,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: competition?.name || '',
    description: competition?.description || '',
    location: competition?.location || '',
    competition_date: competition?.competition_date || '',
    comp_type: competition?.comp_type || 'air_force',
    overall_placement: competition?.armed_regulation || 'NA',
    overall_armed_placement: competition?.armed_exhibition || 'NA',
    overall_unarmed_placement: competition?.armed_color_guard || 'NA',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const placementOptions = ['NA', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  const programOptions = [
    { value: 'air_force', label: 'Air Force' },
    { value: 'army', label: 'Army' },
    { value: 'navy', label: 'Navy' },
    { value: 'marine_corps', label: 'Marine Corps' },
    { value: 'coast_guard', label: 'Coast Guard' },
    { value: 'space_force', label: 'Space Force' }
  ];


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <Label htmlFor="comp_type">JROTC Program</Label>
          <Select value={formData.comp_type} onValueChange={(value) => updateFormData('comp_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {programOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <AddressLookupField
          value={formData.location}
          onValueChange={(value) => updateFormData('location', value)}
          placeholder="Enter location or search address"
        />
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

      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Awards</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="overall_placement">Overall Placement</Label>
            <Select 
              value={formData.overall_placement} 
              onValueChange={(value) => updateFormData('overall_placement', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {placementOptions.map((placement) => (
                  <SelectItem key={placement} value={placement}>
                    {placement}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="overall_armed_placement">Overall Armed Placement</Label>
            <Select 
              value={formData.overall_armed_placement} 
              onValueChange={(value) => updateFormData('overall_armed_placement', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {placementOptions.map((placement) => (
                  <SelectItem key={placement} value={placement}>
                    {placement}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="overall_unarmed_placement">Overall Unarmed Placement</Label>
            <Select 
              value={formData.overall_unarmed_placement} 
              onValueChange={(value) => updateFormData('overall_unarmed_placement', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {placementOptions.map((placement) => (
                  <SelectItem key={placement} value={placement}>
                    {placement}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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