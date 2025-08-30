import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useCadetsByFlight } from '../hooks/useCadetsByFlight';
import { useUniformInspectionBulk } from '../hooks/useUniformInspectionBulk';

interface UniformInspectionBulkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const FLIGHTS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];

export const UniformInspectionBulkDialog = ({
  open,
  onOpenChange,
  onSuccess
}: UniformInspectionBulkDialogProps) => {
  const [date, setDate] = useState<Date>();
  const [selectedFlight, setSelectedFlight] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const {
    cadets,
    isLoading: cadetsLoading
  } = useCadetsByFlight(selectedFlight);

  const {
    loading: saving,
    updateCadetScore,
    getCadetScores,
    cadetDataWithScores,
    saveUniformInspections,
    resetData
  } = useUniformInspectionBulk();

  // Check for unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(cadetDataWithScores.length > 0);
  }, [cadetDataWithScores]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setDate(undefined);
      setSelectedFlight('');
      setHasUnsavedChanges(false);
      setShowConfirmDialog(false);
      resetData();
    }
  }, [open]);

  const handleSave = async () => {
    if (!date) {
      return;
    }
    const success = await saveUniformInspections(date, cadetDataWithScores);
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

  const isFormValid = date && selectedFlight;

  return (
    <>
      <Dialog open={open} onOpenChange={hasUnsavedChanges ? handleClose : onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Uniform Inspection Entry</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inspection-date">Inspection Date</Label>
                <Input
                  id="inspection-date"
                  type="date"
                  value={date ? format(date, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    if (dateValue) {
                      setDate(new Date(dateValue + 'T00:00:00'));
                    } else {
                      setDate(undefined);
                    }
                  }}
                  className="w-full"
                />
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
                    <div className="grid grid-cols-4 gap-2 p-3 bg-muted font-medium text-sm">
                      <div className="col-span-2">Cadet</div>
                      <div>Grade</div>
                      <div>Notes</div>
                    </div>

                    {/* Cadet Rows */}
                    <div className="divide-y">
                      {cadets.map((cadet) => {
                        const scores = getCadetScores(cadet.id);
                        return (
                          <div key={cadet.id} className="grid grid-cols-4 gap-2 p-3 items-start">
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
                                placeholder="0-100"
                                min="0"
                                max="100"
                                value={scores.grade}
                                onChange={(e) => updateCadetScore(cadet.id, 'grade', e.target.value)}
                                className="w-full"
                              />
                            </div>

                            <div>
                              <Textarea
                                placeholder="Optional notes"
                                value={scores.notes}
                                onChange={(e) => updateCadetScore(cadet.id, 'notes', e.target.value)}
                                className="w-full min-h-[40px] resize-none"
                                rows={2}
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
            {cadetDataWithScores.length > 0 && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Ready to save uniform inspection results for {cadetDataWithScores.length} cadet{cadetDataWithScores.length !== 1 ? 's' : ''} with scores
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isFormValid || saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Inspections
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Unsaved Changes */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved uniform inspection data. What would you like to do?
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
    </>
  );
};