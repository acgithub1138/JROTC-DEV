import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompetitionSchools } from '@/hooks/competition-portal/useCompetitionSchools';
import type { Database } from '@/integrations/supabase/types';

type CompSchoolInsert = Database['public']['Tables']['cp_comp_schools']['Insert'];

interface AddSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
}

export const AddSchoolModal: React.FC<AddSchoolModalProps> = ({
  isOpen,
  onClose,
  competitionId
}) => {
  const { createSchool } = useCompetitionSchools(competitionId);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSchools, setAvailableSchools] = useState<any[]>([]);
  const [availableResources, setAvailableResources] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<CompSchoolInsert>>({
    competition_id: competitionId,
    status: 'registered',
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available schools
        const { data: schoolsData, error: schoolsError } = await supabase
          .from('schools')
          .select('id, name');
        
        if (schoolsError) throw schoolsError;
        setAvailableSchools(schoolsData || []);

        // Fetch available resources (judges)
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('cp_judges')
          .select('*')
          .eq('available', true);
        
        if (resourcesError) throw resourcesError;
        setAvailableResources(resourcesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.school_id) {
      toast.error('Please select a school');
      return;
    }

    setIsLoading(true);
    try {
      await createSchool(formData as CompSchoolInsert);
      onClose();
      setFormData({
        competition_id: competitionId,
        status: 'registered',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding school:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add School to Competition</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="school">School *</Label>
            <Select
              value={formData.school_id?.toString() || ''}
              onValueChange={(value) => handleChange('school_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select school" />
              </SelectTrigger>
              <SelectContent>
                {availableSchools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="resource">Assigned Resource</Label>
            <Select
              value={formData.resource?.toString() || ''}
              onValueChange={(value) => handleChange('resource', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select resource (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No resource assigned</SelectItem>
                {availableResources.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id}>
                    {resource.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status || 'registered'}
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes about this school's registration"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add School'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};