import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddressLookupField } from '@/components/calendar/components/AddressLookupField';
import { MultiSelectProfiles } from '@/components/inventory-management/components/MultiSelectProfiles';
import { useTeams } from '@/components/teams/hooks/useTeams';
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
  const { teams } = useTeams();
  const [formData, setFormData] = useState({
    name: competition?.name || '',
    description: competition?.description || '',
    location: competition?.location || '',
    competition_date: competition?.competition_date || '',
    registration_deadline: competition?.registration_deadline || '',
    type: competition?.type || 'individual',
    comp_type: competition?.comp_type || 'air_force',
    teams: competition?.teams || [],
    cadets: competition?.cadets || [],
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
  const programOptions = [
    { value: 'air_force', label: 'Air Force' },
    { value: 'army', label: 'Army' },
    { value: 'navy', label: 'Navy' },
    { value: 'marine_corps', label: 'Marine Corps' },
    { value: 'coast_guard', label: 'Coast Guard' },
    { value: 'space_force', label: 'Space Force' }
  ];

  const typeOptions = [
    { value: 'individual', label: 'Individual' },
    { value: 'team', label: 'Team' },
    { value: 'mixed', label: 'Mixed' }
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
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => updateFormData('type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        <div className="space-y-2">
          <Label htmlFor="registration_deadline">Registration Deadline</Label>
          <Input
            id="registration_deadline"
            type="date"
            value={formData.registration_deadline || ''}
            onChange={(e) => updateFormData('registration_deadline', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          value={formData.location}
          onChange={(e) => updateFormData('location', e.target.value)}
          placeholder="Enter competition location"
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