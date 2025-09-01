import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useCadetsByFlight } from './hooks/useCadetsByFlight';
import { useUniformInspectionBulk } from './hooks/useUniformInspectionBulk';
import { toast } from 'sonner';

const FLIGHTS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];

export const InspectionCreatePage = () => {
  const navigate = useNavigate();
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

  const handleSave = async () => {
    if (!date) {
      toast.error('Please select an inspection date');
      return;
    }
    const success = await saveUniformInspections(date, cadetDataWithScores);
    if (success) {
      setHasUnsavedChanges(false);
      toast.success('Uniform inspections saved successfully');
      navigate('/app/cadets');
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      navigate('/app/cadets');
    }
  };

  const confirmLeave = () => {
    setShowConfirmDialog(false);
    setHasUnsavedChanges(false);
    resetData();
    navigate('/app/cadets');
  };

  const saveAndLeave = async () => {
    setShowConfirmDialog(false);
    await handleSave();
  };

  const stayOnForm = () => {
    setShowConfirmDialog(false);
  };

  const isFormValid = date && selectedFlight;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cadets
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Uniform Inspection Entry</h1>
            <p className="text-muted-foreground">Record uniform inspection results for cadets</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inspection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Header Controls */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <Label htmlFor="inspection-date" className="w-32 text-right shrink-0">Inspection Date</Label>
                <div className="flex-1">
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
              </div>

              <div className="flex items-center gap-4">
                <Label htmlFor="flight" className="w-32 text-right shrink-0">Flight</Label>
                <div className="flex-1">
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 bg-muted font-medium text-sm">
                      <div className="md:col-span-2">Cadet</div>
                      <div>Grade</div>
                      <div>Notes</div>
                    </div>

                    {/* Cadet Rows */}
                    <div className="divide-y">
                      {cadets.map((cadet) => {
                        const scores = getCadetScores(cadet.id);
                        return (
                          <div key={cadet.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 items-start">
                            <div className="md:col-span-2">
                              <div className="font-medium">
                                {cadet.last_name}, {cadet.first_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {cadet.grade && `${cadet.grade} • `}{cadet.rank}
                              </div>
                            </div>

                            <div className="space-y-2 md:space-y-0">
                              <Label className="md:hidden">Grade</Label>
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

                            <div className="space-y-2 md:space-y-0">
                              <Label className="md:hidden">Notes</Label>
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

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={handleBack} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!isFormValid || saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Inspections
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <Button onClick={confirmLeave} variant="outline">
              Leave Without Saving
            </Button>
            <AlertDialogAction onClick={saveAndLeave} disabled={!isFormValid || saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};