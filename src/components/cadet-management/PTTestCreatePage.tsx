import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CalendarIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useCadetsByFlight } from './hooks/useCadetsByFlight';
import { usePTTestBulk } from './hooks/usePTTestBulk';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const FLIGHTS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];

export const PTTestCreatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();
  const { users: schoolUsers } = useSchoolUsers(true);
  
  const initialMode = searchParams.get('mode') === 'bulk' ? 'bulk' : 'single';
  const [mode, setMode] = useState<'single' | 'bulk'>(initialMode);
  
  // Single cadet form state
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleData, setSingleData] = useState({
    cadetId: '',
    date: undefined as Date | undefined,
    pushUps: '',
    sitUps: '',
    plankTime: '',
    mileTime: ''
  });
  
  // Bulk form state
  const [bulkDate, setBulkDate] = useState<Date>();
  const [selectedFlight, setSelectedFlight] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const { cadets, isLoading: cadetsLoading } = useCadetsByFlight(selectedFlight);
  const {
    loading: bulkSaving,
    updateCadetScore,
    getCadetScores,
    cadetDataWithPushUps,
    savePTTests,
    resetData
  } = usePTTestBulk();

  // Filter to exclude instructors, sorted by last name
  const cadets_single = schoolUsers
    .filter(user => user.role !== 'instructor')
    .sort((a, b) => a.last_name.localeCompare(b.last_name));

  // Check for unsaved changes in bulk mode
  React.useEffect(() => {
    if (mode === 'bulk') {
      setHasUnsavedChanges(cadetDataWithPushUps.length > 0);
    }
  }, [cadetDataWithPushUps, mode]);

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!singleData.cadetId || !singleData.date) {
      toast({
        title: "Validation Error",
        description: "Please select a cadet and date.",
        variant: "destructive"
      });
      return;
    }

    setSingleLoading(true);
    
    try {
      const { error } = await supabase
        .from('pt_tests')
        .insert({
          school_id: userProfile?.school_id,
          cadet_id: singleData.cadetId,
          date: format(singleData.date, 'yyyy-MM-dd'),
          push_ups: singleData.pushUps ? parseInt(singleData.pushUps) : null,
          sit_ups: singleData.sitUps ? parseInt(singleData.sitUps) : null,
          plank_time: singleData.plankTime ? parseInt(singleData.plankTime) : null,
          mile_time: singleData.mileTime ? parseInt(singleData.mileTime) : null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "PT test record created successfully."
      });

      navigate(-1);
    } catch (error) {
      console.error('Error creating PT test:', error);
      toast({
        title: "Error",
        description: "Failed to create PT test record. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSingleLoading(false);
    }
  };

  const handleBulkSave = async () => {
    if (!bulkDate) return;
    
    const success = await savePTTests(bulkDate, cadetDataWithPushUps);
    if (success) {
      setHasUnsavedChanges(false);
      navigate(-1);
    }
  };

  const handleBack = () => {
    if (mode === 'bulk' && hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      navigate(-1);
    }
  };

  const confirmLeave = () => {
    setShowConfirmDialog(false);
    navigate(-1);
  };

  const stayOnForm = () => {
    setShowConfirmDialog(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={handleBack} size="sm">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Add PT Test Records</h1>
          <p className="text-muted-foreground">
            Create PT test records for cadets
          </p>
        </div>

        {/* Mode Selection Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant={mode === 'single' ? 'default' : 'outline'}
            onClick={() => setMode('single')}
            className="w-full"
          >
            Single Cadet
          </Button>
          <Button 
            variant={mode === 'bulk' ? 'default' : 'outline'}
            onClick={() => setMode('bulk')}
            className="w-full"
          >
            Bulk Entry
          </Button>
        </div>
      </div>

      {/* Single Cadet Form */}
      {mode === 'single' && (
        <Card>
          <CardHeader>
            <CardTitle>Single Cadet PT Test</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSingleSubmit} className="space-y-6">
              {/* Row 1: Cadet and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <Label htmlFor="cadet" className="md:w-20 md:text-right flex-shrink-0">Cadet *</Label>
                  <div className="flex-1">
                    <Select
                      value={singleData.cadetId}
                      onValueChange={(value) => setSingleData(prev => ({ ...prev, cadetId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a cadet" />
                      </SelectTrigger>
                      <SelectContent>
                        {cadets_single.map((cadet) => (
                          <SelectItem key={cadet.id} value={cadet.id}>
                            {cadet.last_name}, {cadet.first_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <Label className="md:w-16 md:text-right flex-shrink-0">Date *</Label>
                  <div className="flex-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !singleData.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {singleData.date ? format(singleData.date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={singleData.date}
                          onSelect={(date) => setSingleData(prev => ({ ...prev, date }))}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Row 2: Push-ups and Sit-ups */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <Label htmlFor="pushUps" className="md:w-20 md:text-right flex-shrink-0">Push-ups</Label>
                  <div className="flex-1">
                    <Input
                      id="pushUps"
                      type="number"
                      min="0"
                      placeholder="Enter number"
                      value={singleData.pushUps}
                      onChange={(e) => setSingleData(prev => ({ ...prev, pushUps: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <Label htmlFor="sitUps" className="md:w-16 md:text-right flex-shrink-0">Sit-ups</Label>
                  <div className="flex-1">
                    <Input
                      id="sitUps"
                      type="number"
                      min="0"
                      placeholder="Enter number"
                      value={singleData.sitUps}
                      onChange={(e) => setSingleData(prev => ({ ...prev, sitUps: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Plank Time and Mile Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                  <Label htmlFor="plankTime" className="md:w-20 md:text-right flex-shrink-0 md:pt-2">Plank Time</Label>
                  <div className="flex-1 space-y-1">
                    <Input
                      id="plankTime"
                      type="number"
                      min="0"
                      placeholder="Enter seconds"
                      value={singleData.plankTime}
                      onChange={(e) => setSingleData(prev => ({ ...prev, plankTime: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Enter time in seconds (e.g., 120 for 2 minutes)</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
                  <Label htmlFor="mileTime" className="md:w-16 md:text-right flex-shrink-0 md:pt-2">Mile Time</Label>
                  <div className="flex-1 space-y-1">
                    <Input
                      id="mileTime"
                      type="number"
                      min="0"
                      placeholder="Enter seconds"
                      value={singleData.mileTime}
                      onChange={(e) => setSingleData(prev => ({ ...prev, mileTime: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Enter time in seconds (e.g., 480 for 8:00)</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={singleLoading} className="w-full md:w-auto">
                  {singleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save PT Test
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bulk Entry Form */}
      {mode === 'bulk' && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk PT Test Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Header Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <Label htmlFor="test-date" className="md:w-20 md:text-right flex-shrink-0">Test Date</Label>
                <div className="flex-1">
                  <Input 
                    id="test-date" 
                    type="date" 
                    value={bulkDate ? format(bulkDate, 'yyyy-MM-dd') : ''} 
                    onChange={(e) => {
                      const dateValue = e.target.value;
                      if (dateValue) {
                        setBulkDate(new Date(dateValue + 'T00:00:00'));
                      } else {
                        setBulkDate(undefined);
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

                              {/* Push Ups / Sit-Ups */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-sm">Push-Ups</Label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    value={scores.pushUps}
                                    onChange={(e) => updateCadetScore(cadet.id, 'pushUps', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm">Sit-Ups</Label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    value={scores.sitUps}
                                    onChange={(e) => updateCadetScore(cadet.id, 'sitUps', e.target.value)}
                                  />
                                </div>
                              </div>

                              {/* Plank Time / Mile Time */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-sm">Plank Time</Label>
                                  <Input
                                    placeholder="MM:SS"
                                    value={scores.plankTime}
                                    onChange={(e) => updateCadetScore(cadet.id, 'plankTime', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm">Mile Time</Label>
                                  <Input
                                    placeholder="MM:SS"
                                    value={scores.mileTime}
                                    onChange={(e) => updateCadetScore(cadet.id, 'mileTime', e.target.value)}
                                  />
                                </div>
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
            {cadetDataWithPushUps.length > 0 && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Ready to save PT test results for {cadetDataWithPushUps.length} cadet{cadetDataWithPushUps.length !== 1 ? 's' : ''} with Push-Ups data
                </p>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleBulkSave} 
                disabled={!bulkDate || !selectedFlight || bulkSaving}
                className="w-full md:w-auto"
              >
                {bulkSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save PT Tests
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog for Unsaved Changes */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved PT test data. Are you sure you want to leave without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={stayOnForm}>Stay on Form</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave}>
              Leave Without Saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};