import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CopyCompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, startDate: Date, endDate: Date) => void;
  originalCompetitionName: string;
  isLoading?: boolean;
}

export const CopyCompetitionModal: React.FC<CopyCompetitionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  originalCompetitionName,
  isLoading = false
}) => {
  const [name, setName] = useState(`${originalCompetitionName} (Copy)`);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Track initial values to detect changes
  const initialName = `${originalCompetitionName} (Copy)`;

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = name !== initialName || startDate !== undefined || endDate !== undefined;
    setHasUnsavedChanges(hasChanges);
  }, [name, startDate, endDate, initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }
    
    if (!startDate || !endDate) {
      return;
    }
    
    if (endDate < startDate) {
      return;
    }
    
    onConfirm(name.trim(), startDate, endDate);
  };

  const handleClose = () => {
    if (isLoading) return;
    
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setName(`${originalCompetitionName} (Copy)`);
    setStartDate(undefined);
    setEndDate(undefined);
    setHasUnsavedChanges(false);
  };

  const handleConfirmClose = () => {
    setShowUnsavedDialog(false);
    resetForm();
    onClose();
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    setShowStartCalendar(false);
    // Auto-set end date to same as start date
    if (date) {
      setEndDate(date);
    }
  };

  const isFormValid = name.trim() && startDate && endDate && endDate >= startDate;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Copy Competition</DialogTitle>
          <DialogDescription>
            Create a copy of "{originalCompetitionName}" with a new name and dates.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="competition-name">Competition Name *</Label>
            <Input
              id="competition-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter competition name"
              disabled={isLoading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateSelect}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setShowEndCalendar(false);
                    }}
                    disabled={(date) => {
                      const minDate = startDate || new Date();
                      return date < minDate;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {endDate && startDate && endDate < startDate && (
            <p className="text-sm text-destructive">End date must be on or after the start date.</p>
          )}
        </form>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Copying...' : 'Copy Competition'}
          </Button>
        </DialogFooter>

        {/* Unsaved Changes Alert Dialog */}
        <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Are you sure you want to close without copying the competition?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmClose}>
                Close Without Saving
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};