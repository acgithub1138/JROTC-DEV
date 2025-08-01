import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CompSchoolInsert = Database['public']['Tables']['cp_comp_schools']['Insert'];

interface AddSchoolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  onSchoolAdded: (school: Omit<CompSchoolInsert, 'created_by'> & { competition_id: string }) => void;
}

export const AddSchoolModal: React.FC<AddSchoolModalProps> = ({
  open,
  onOpenChange,
  competitionId,
  onSchoolAdded
}) => {
  const [formData, setFormData] = useState({
    school_id: '',
    resource: '',
    status: 'registered',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<Array<{id: string, name: string}>>([]);
  const [resources, setResources] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    if (open) {
      fetchSchools();
      fetchResources();
    }
  }, [open]);

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error('Failed to load schools');
    }
  };

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
    if (!formData.school_id) {
      toast.error('Please select a school');
      return;
    }

    setIsLoading(true);
    try {
      const schoolData: Omit<CompSchoolInsert, 'created_by'> & { competition_id: string } = {
        competition_id: competitionId,
        school_id: formData.school_id,
        resource: formData.resource || null,
        status: formData.status,
        notes: formData.notes || null
      };

      await onSchoolAdded(schoolData);
      onOpenChange(false);
      setFormData({
        school_id: '',
        resource: '',
        status: 'registered',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding school:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add School to Competition</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="school_id">School *</Label>
            <Select value={formData.school_id} onValueChange={(value) => setFormData(prev => ({ ...prev, school_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a school" />
              </SelectTrigger>
              <SelectContent>
                {schools.map(school => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="resource">Assigned Resource</Label>
            <Select value={formData.resource} onValueChange={(value) => setFormData(prev => ({ ...prev, resource: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a resource (optional)" />
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
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
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
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this school's registration"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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