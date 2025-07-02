
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { flightOptions } from '../constants';

interface MassUpdateFlightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (flight: string) => Promise<boolean>;
  selectedCount: number;
  loading: boolean;
}

export const MassUpdateFlightDialog = ({
  open,
  onOpenChange,
  onSubmit,
  selectedCount,
  loading
}: MassUpdateFlightDialogProps) => {
  const [flight, setFlight] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flight) return;
    
    const success = await onSubmit(flight);
    if (success) {
      setFlight('');
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setFlight('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Flight for {selectedCount} Cadet{selectedCount !== 1 ? 's' : ''}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="flight">Flight</Label>
            <Select value={flight} onValueChange={setFlight}>
              <SelectTrigger>
                <SelectValue placeholder="Select flight..." />
              </SelectTrigger>
              <SelectContent>
                {flightOptions.map((flightOption) => (
                  <SelectItem key={flightOption} value={flightOption}>
                    {flightOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !flight}>
              {loading ? 'Updating...' : 'Update Flight'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
