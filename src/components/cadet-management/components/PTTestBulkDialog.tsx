import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCadetsByFlight } from '../hooks/useCadetsByFlight';
import { usePTTestBulk } from '../hooks/usePTTestBulk';

interface PTTestBulkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const FLIGHTS = ['Alpha', 'Bravo', 'Charlie', 'Delta'];

export const PTTestBulkDialog = ({ open, onOpenChange, onSuccess }: PTTestBulkDialogProps) => {
  const [date, setDate] = useState<Date>();
  const [selectedFlight, setSelectedFlight] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const { cadets, isLoading: cadetsLoading } = useCadetsByFlight(selectedFlight);
  const {
    loading: saving,
    updateCadetScore,
    getCadetScores,
    cadetDataWithPushUps,
    savePTTests,
    resetData,
  } = usePTTestBulk();

  // Check for unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(cadetDataWithPushUps.length > 0);
  }, [cadetDataWithPushUps]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setDate(undefined);
      setSelectedFlight('');
      setHasUnsavedChanges(false);
      setShowConfirmDialog(false);
      resetData();
    }
  }, [open]); // Remove resetData from dependencies to prevent infinite loop

  const handleSave = async () => {
    if (!date) {
      return;
    }

    const success = await savePTTests(date, cadetDataWithPushUps);
    if (success) {
      setHasUnsavedChanges(false);
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const confirmClose = () => {
    setShowConfirmDialog(false);
    setHasUnsavedChanges(false);
    onOpenChange(false);
  };

  const saveAndClose = async () => {
    setShowConfirmDialog(false);
    await handleSave();
  };

  const stayOnForm = () => {
    setShowConfirmDialog(false);
  };

  const formatTimeDisplay = (seconds: string) => {
    if (!seconds) return '';
    // If it's already in MM:SS format, return as is
    if (seconds.includes(':')) return seconds;
    // Convert seconds to MM:SS for display
    const num = parseInt(seconds);
    if (isNaN(num)) return seconds;
    const mins = Math.floor(num / 60);
    const secs = num % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isFormValid = date && selectedFlight;

  return (
    <Dialog open={open} onOpenChange={hasUnsavedChanges ? handleClose : onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk PT Test Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-date">Test Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flight">Flight</Label>
              <Select value={selectedFlight} onValueChange={setSelectedFlight}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a flight" />
                </SelectTrigger>
                <SelectContent>
                  {FLIGHTS.map((flight) => (
                    <SelectItem key={flight} value={flight}>
                      {flight}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cadets Grid */}
          {selectedFlight && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {cadets.length} Cadet{cadets.length !== 1 ? 's' : ''} in {selectedFlight} Flight
                </h3>
                {cadetsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>

              {cadets.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="grid grid-cols-6 gap-2 p-3 bg-muted font-medium text-sm">
                    <div className="col-span-2">Cadet</div>
                    <div>Push-Ups</div>
                    <div>Sit-Ups</div>
                    <div>Plank Time</div>
                    <div>Mile Time</div>
                  </div>

                  {/* Cadet Rows */}
                  <div className="divide-y">
                    {cadets.map((cadet) => {
                      const scores = getCadetScores(cadet.id);
                      return (
                        <div key={cadet.id} className="grid grid-cols-6 gap-2 p-3 items-center">
                          <div className="col-span-2">
                            <div className="font-medium">
                              {cadet.last_name}, {cadet.first_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {cadet.grade && `${cadet.grade} • `}{cadet.rank}
                            </div>
                          </div>

                          <div>
                            <Input
                              type="number"
                              placeholder="0"
                              min="0"
                              value={scores.pushUps}
                              onChange={(e) => updateCadetScore(cadet.id, 'pushUps', e.target.value)}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Input
                              type="number"
                              placeholder="0"
                              min="0"
                              value={scores.sitUps}
                              onChange={(e) => updateCadetScore(cadet.id, 'sitUps', e.target.value)}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Input
                              placeholder="MM:SS or seconds"
                              value={scores.plankTime}
                              onChange={(e) => updateCadetScore(cadet.id, 'plankTime', e.target.value)}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Input
                              placeholder="MM:SS or seconds"
                              value={scores.mileTime}
                              onChange={(e) => updateCadetScore(cadet.id, 'mileTime', e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedFlight && !cadetsLoading && cadets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No cadets found in {selectedFlight} flight
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {cadetDataWithPushUps.length > 0 && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Ready to save PT test results for {cadetDataWithPushUps.length} cadet{cadetDataWithPushUps.length !== 1 ? 's' : ''} with Push-Ups data
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save PT Tests
          </Button>
        </div>
      </DialogContent>

      {/* Confirmation Dialog for Unsaved Changes */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved PT test data. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={stayOnForm}>Stay on Form</AlertDialogCancel>
            <Button onClick={confirmClose} variant="outline">
              Close Without Saving
            </Button>
            <AlertDialogAction onClick={saveAndClose} disabled={!isFormValid || saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};