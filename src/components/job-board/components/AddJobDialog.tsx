
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useJobBoardRoles } from '../hooks/useJobBoardRoles';
import { NewJobBoard } from '../types';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface AddJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (job: NewJobBoard) => void;
  loading: boolean;
  jobs: any[]; // Add jobs prop to get assigned cadets
}

export const AddJobDialog = ({ open, onOpenChange, onSubmit, loading, jobs }: AddJobDialogProps) => {
  const [formData, setFormData] = useState<NewJobBoard>({
    cadet_id: '',
    role: '',
    reports_to: '',
    assistant: '',
  });

  const { users: cadets } = useSchoolUsers(true); // Only active cadets
  const { roles } = useJobBoardRoles();
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  // Reset form and refetch roles when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        cadet_id: '',
        role: '',
        reports_to: '',
        assistant: '',
      });
      // Invalidate roles query to refetch latest roles
      queryClient.invalidateQueries({ queryKey: ['job-board-roles', userProfile?.school_id] });
    }
  }, [open, queryClient, userProfile?.school_id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role || !formData.reports_to || !formData.assistant) return;
    
    onSubmit({
      ...formData,
      cadet_id: formData.cadet_id === 'unassigned' ? undefined : formData.cadet_id,
      reports_to: formData.reports_to || undefined,
      assistant: formData.assistant || undefined,
    });
  };

  const handleClose = () => {
    setFormData({
      cadet_id: '',
      role: '',
      reports_to: '',
      assistant: '',
    });
    onOpenChange(false);
  };

  const formatCadetName = (cadet: any) => {
    return `${cadet.last_name}, ${cadet.first_name}${cadet.rank ? ` - ${cadet.rank}` : ''}`;
  };

  // Get assigned cadet IDs
  const assignedCadetIds = new Set(jobs.map(job => job.cadet_id));
  
  // Filter for active cadets only, exclude already assigned, and sort by last name
  const activeCadets = cadets
    .filter(cadet => cadet.active && !assignedCadetIds.has(cadet.id))
    .sort((a, b) => a.last_name.localeCompare(b.last_name));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cadet">Cadet</Label>
            <Select
              value={formData.cadet_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, cadet_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cadet..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {activeCadets.map((cadet) => (
                  <SelectItem key={cadet.id} value={cadet.id}>
                    {formatCadetName(cadet)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              placeholder="Enter job role..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reports_to">Reports To *</Label>
            <Select
              value={formData.reports_to}
              onValueChange={(value) => {
                setFormData(prev => ({ 
                  ...prev, 
                  reports_to: value,
                  // If setting reports_to to non-NA, set assistant to NA
                  assistant: value !== 'NA' ? 'NA' : prev.assistant
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NA">NA</SelectItem>
                {[...roles].sort().map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assistant">Assistant *</Label>
            <Select
              value={formData.assistant}
              onValueChange={(value) => {
                setFormData(prev => ({ 
                  ...prev, 
                  assistant: value,
                  // If setting assistant to non-NA, set reports_to to NA
                  reports_to: value !== 'NA' ? 'NA' : prev.reports_to
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NA">NA</SelectItem>
                {[...roles].sort().map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.role || !formData.reports_to || !formData.assistant}
            >
              {loading ? 'Adding...' : 'Add Job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
