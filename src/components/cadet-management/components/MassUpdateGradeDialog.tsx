
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { gradeOptions } from '../constants';

interface MassUpdateGradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (grade: string) => Promise<boolean>;
  selectedCount: number;
  loading: boolean;
}

export const MassUpdateGradeDialog = ({
  open,
  onOpenChange,
  onSubmit,
  selectedCount,
  loading
}: MassUpdateGradeDialogProps) => {
  const [grade, setGrade] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade) return;
    
    const success = await onSubmit(grade);
    if (success) {
      setGrade('');
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setGrade('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Grade for {selectedCount} Cadet{selectedCount !== 1 ? 's' : ''}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grade">Grade</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger>
                <SelectValue placeholder="Select grade..." />
              </SelectTrigger>
              <SelectContent>
                {gradeOptions.map((gradeOption) => (
                  <SelectItem key={gradeOption} value={gradeOption}>
                    {gradeOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !grade}>
              {loading ? 'Updating...' : 'Update Grade'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
