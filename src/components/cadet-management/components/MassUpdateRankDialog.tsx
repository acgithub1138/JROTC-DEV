
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAllRankOptions } from '@/utils/jrotcRanks';

interface MassUpdateRankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rank: string) => Promise<boolean>;
  selectedCount: number;
  loading: boolean;
}

export const MassUpdateRankDialog = ({
  open,
  onOpenChange,
  onSubmit,
  selectedCount,
  loading
}: MassUpdateRankDialogProps) => {
  const [rank, setRank] = useState('');
  const rankOptions = getAllRankOptions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rank) return;
    
    const success = await onSubmit(rank);
    if (success) {
      setRank('');
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setRank('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Rank for {selectedCount} Cadet{selectedCount !== 1 ? 's' : ''}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rank">Rank</Label>
            <Select value={rank} onValueChange={setRank}>
              <SelectTrigger>
                <SelectValue placeholder="Select rank..." />
              </SelectTrigger>
              <SelectContent>
                {rankOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !rank}>
              {loading ? 'Updating...' : 'Update Rank'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
