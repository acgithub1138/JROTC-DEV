import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CompResourceInsert = Database['public']['Tables']['cp_comp_resources']['Insert'];

interface AddResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  onResourceAdded: (resource: Omit<CompResourceInsert, 'school_id' | 'created_by'> & { competition_id: string }) => void;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  open,
  onOpenChange,
  competitionId,
  onResourceAdded
}) => {
  const [formData, setFormData] = useState({
    resource: '',
    location: '',
    start_time: '',
    end_time: '',
    assignment_details: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [resources, setResources] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    if (open) {
      fetchResources();
    }
  }, [open]);

  const fetchResources = async () => {
    try {
      // This would need to be updated to fetch from actual resources table
      // For now, using placeholder data
      setResources([
        { id: '1', name: 'Venue A' },
        { id: '2', name: 'Venue B' },
        { id: '3', name: 'Equipment Set 1' },
        { id: '4', name: 'Equipment Set 2' }
      ]);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resource) {
      toast.error('Please select a resource');
      return;
    }

    setIsLoading(true);
    try {
      const resourceData: Omit<CompResourceInsert, 'school_id' | 'created_by'> & { competition_id: string } = {
        competition_id: competitionId,
        resource: formData.resource,
        location: formData.location || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        assignment_details: formData.assignment_details || null
      };

      await onResourceAdded(resourceData);
      onOpenChange(false);
      setFormData({
        resource: '',
        location: '',
        start_time: '',
        end_time: '',
        assignment_details: ''
      });
    } catch (error) {
      console.error('Error adding resource:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Competition Resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="resource">Resource *</Label>
            <Select value={formData.resource} onValueChange={(value) => setFormData(prev => ({ ...prev, resource: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a resource" />
              </SelectTrigger>
              <SelectContent>
                {resources.map(resource => (
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
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Resource location"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="assignment_details">Assignment Details</Label>
            <Textarea
              id="assignment_details"
              value={formData.assignment_details}
              onChange={(e) => setFormData(prev => ({ ...prev, assignment_details: e.target.value }))}
              placeholder="Details about resource assignment"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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