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
    overall_placement: competition?.overall_placement || 'NA',
    overall_armed_placement: competition?.overall_armed_placement || 'NA',
    overall_unarmed_placement: competition?.overall_unarmed_placement || 'NA',
    armed_regulation: competition?.armed_regulation || 'NA',
    armed_exhibition: competition?.armed_exhibition || 'NA',
    armed_color_guard: competition?.armed_color_guard || 'NA',
    armed_inspection: competition?.armed_inspection || 'NA',
    unarmed_regulation: competition?.unarmed_regulation || 'NA',
    unarmed_exhibition: competition?.unarmed_exhibition || 'NA',
    unarmed_color_guard: competition?.unarmed_color_guard || 'NA',
    unarmed_inspection: competition?.unarmed_inspection || 'NA',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const placementOptions = ['NA', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
  const competitionTypeOptions = [
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
      
      // Map form data to database structure with correct field mappings
      const submissionData = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        competition_date: formData.competition_date,
        comp_type: formData.comp_type,
        type: 'drill' as const, // Use valid enum value
        // New overall placement fields
        overall_placement: formData.overall_placement,
        overall_armed_placement: formData.overall_armed_placement, 
        overall_unarmed_placement: formData.overall_unarmed_placement,
        // Existing individual event placements mapped correctly
        armed_regulation: formData.armed_regulation,
        armed_exhibition: formData.armed_exhibition,
        armed_color_guard: formData.armed_color_guard,
        armed_inspection: formData.armed_inspection,
        unarmed_regulation: formData.unarmed_regulation,
        unarmed_exhibition: formData.unarmed_exhibition,
        unarmed_color_guard: formData.unarmed_color_guard,
        unarmed_inspection: formData.unarmed_inspection,
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="comp_type">Competition Type</Label>
        <Select value={formData.comp_type} onValueChange={(value) => updateFormData('comp_type', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {competitionTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Armed Events</h3>
          
          {(['armed_regulation', 'armed_exhibition', 'armed_color_guard', 'armed_inspection'] as const).map((event) => (
            <div key={event} className="space-y-2">
              <Label>{event.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
              <Select 
                value={formData[event]} 
                onValueChange={(value) => updateFormData(event, value)}
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
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Unarmed Events</h3>
          
          {(['unarmed_regulation', 'unarmed_exhibition', 'unarmed_color_guard', 'unarmed_inspection'] as const).map((event) => (
            <div key={event} className="space-y-2">
              <Label>{event.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
              <Select 
                value={formData[event]} 
                onValueChange={(value) => updateFormData(event, value)}
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
          ))}
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