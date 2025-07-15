
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useJobBoardRoles } from '../hooks/useJobBoardRoles';
import { JobBoardWithCadet, NewJobBoard } from '../types';

interface EditJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobBoardWithCadet | null;
  onSubmit: (id: string, updates: Partial<NewJobBoard>) => void;
  loading: boolean;
  jobs: any[]; // Add jobs prop to get assigned cadets
}

export const EditJobDialog = ({ open, onOpenChange, job, onSubmit, loading, jobs }: EditJobDialogProps) => {
  const [formData, setFormData] = useState<NewJobBoard>({
    cadet_id: '',
    role: '',
    email_address: '',
    reports_to: '',
    assistant: '',
  });

  const { users: cadets } = useSchoolUsers(true); // Only active cadets
  const { roles } = useJobBoardRoles();

  useEffect(() => {
    if (job) {
      setFormData({
        cadet_id: job.cadet_id,
        role: job.role,
        email_address: job.email_address || '',
        reports_to: job.reports_to || '',
        assistant: job.assistant || '',
      });
    }
  }, [job]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !formData.cadet_id || !formData.role) return;
    
    onSubmit(job.id, {
      ...formData,
      reports_to: formData.reports_to || undefined,
      assistant: formData.assistant || undefined,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const formatCadetName = (cadet: any) => {
    return `${cadet.last_name}, ${cadet.first_name}${cadet.rank ? ` - ${cadet.rank}` : ''}`;
  };

  // Get assigned cadet IDs, excluding the current job's cadet
  const assignedCadetIds = new Set(
    jobs.filter(j => j.id !== job?.id).map(j => j.cadet_id)
  );
  
  // Filter for active cadets only, exclude already assigned (except current), and sort by last name
  const activeCadets = cadets
    .filter(cadet => cadet.active && !assignedCadetIds.has(cadet.id))
    .sort((a, b) => a.last_name.localeCompare(b.last_name));

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cadet">Cadet *</Label>
            <Select
              value={formData.cadet_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, cadet_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cadet..." />
              </SelectTrigger>
              <SelectContent>
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
            <Label htmlFor="reports_to">Reports To</Label>
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
            <Label htmlFor="email_address">Email Address</Label>
            <Input
              id="email_address"
              type="email"
              value={formData.email_address}
              onChange={(e) => setFormData(prev => ({ ...prev, email_address: e.target.value }))}
              placeholder="Enter email address..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assistant">Assistant</Label>
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
              disabled={loading || !formData.cadet_id || !formData.role}
            >
              {loading ? 'Updating...' : 'Update Job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
