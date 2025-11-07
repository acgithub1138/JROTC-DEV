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
      navigate(-1);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      navigate(-1);
    }
  };

  const confirmLeave = () => {
    setShowConfirmDialog(false);
    setHasUnsavedChanges(false);
    resetData();
    navigate(-1);
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
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Back Button */}
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cadets
        </Button>

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Uniform Inspection Entry</h1>
          <p className="text-muted-foreground">Record uniform inspection results for cadets</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inspection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Header Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <Label htmlFor="inspection-date" className="md:w-32 md:text-right flex-shrink-0">Inspection Date</Label>
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

              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <Label htmlFor="flight" className="md:w-16 md:text-right flex-shrink-0">Flight</Label>
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
                  <>
                    {/* Desktop Grid View */}
                    <div className="hidden md:block border rounded-lg overflow-hidden">
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

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                      {cadets.map((cadet) => {
                        const scores = getCadetScores(cadet.id);
                        return (
                          <Card key={cadet.id}>
                            <CardContent className="p-4 space-y-4">
                              {/* Cadet Name */}
                              <div>
                                <h4 className="font-medium">
                                  {cadet.last_name}, {cadet.first_name}
                                </h4>
                                {/* Cadet Details */}
                                <p className="text-sm text-muted-foreground">
                                  {cadet.grade && `${cadet.grade} • `}{cadet.rank}
                                </p>
                              </div>

                              {/* Grade */}
                              <div className="space-y-2">
                                <Label className="text-sm">Grade</Label>
                                <Input
                                  type="number"
                                  placeholder="0-100"
                                  min="0"
                                  max="100"
                                  value={scores.grade}
                                  onChange={(e) => updateCadetScore(cadet.id, 'grade', e.target.value)}
                                />
                              </div>

                              {/* Notes */}
                              <div className="space-y-2">
                                <Label className="text-sm">Notes</Label>
                                <Textarea
                                  placeholder="Optional notes"
                                  value={scores.notes}
                                  onChange={(e) => updateCadetScore(cadet.id, 'notes', e.target.value)}
                                  className="min-h-[60px] resize-none"
                                  rows={3}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
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
            <div className="flex flex-col md:flex-row justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleBack} disabled={saving} className="w-full md:w-auto">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!isFormValid || saving} className="w-full md:w-auto">
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