import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompetitionResources } from '@/hooks/competition-portal/useCompetitionResources';
import type { Database } from '@/integrations/supabase/types';

type CompResourceInsert = Database['public']['Tables']['cp_comp_resources']['Insert'];

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  isOpen,
  onClose,
  competitionId
}) => {
  const { createResource } = useCompetitionResources(competitionId);
  const [isLoading, setIsLoading] = useState(false);
  const [availableResources, setAvailableResources] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<CompResourceInsert>>({
    competition_id: competitionId,
    location: '',
    start_time: '',
    end_time: '',
    assignment_details: ''
  });

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const { data, error } = await supabase
          .from('cp_judges')
          .select('*')
          .eq('available', true);
        
        if (error) throw error;
        setAvailableResources(data || []);
      } catch (error) {
        console.error('Error fetching resources:', error);
      }
    };

    if (isOpen) {
      fetchResources();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.resource) {
      toast.error('Please select a resource');
      return;
    }

    setIsLoading(true);
    try {
      await createResource(formData as CompResourceInsert);
      onClose();
      setFormData({
        competition_id: competitionId,
        location: '',
        start_time: '',
        end_time: '',
        assignment_details: ''
      });
    } catch (error) {
      console.error('Error creating resource:', error);
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
          <DialogTitle>Add Competition Resource</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="resource">Resource *</Label>
            <Select
              value={formData.resource?.toString() || ''}
              onValueChange={(value) => handleChange('resource', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select resource" />
              </SelectTrigger>
              <SelectContent>
                {availableResources.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id}>
                    {resource.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Resource assignment location"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time || ''}
                onChange={(e) => handleChange('start_time', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time || ''}
                onChange={(e) => handleChange('end_time', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="assignment_details">Assignment Details</Label>
            <Textarea
              id="assignment_details"
              value={formData.assignment_details || ''}
              onChange={(e) => handleChange('assignment_details', e.target.value)}
              placeholder="Details about the resource assignment"
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Resource'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};