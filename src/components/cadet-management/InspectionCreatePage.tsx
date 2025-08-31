import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Loader2, Users, X } from 'lucide-react';
import { format } from 'date-fns';
import { useUniformInspectionBulk } from './hooks/useUniformInspectionBulk';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export const InspectionCreatePage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [date, setDate] = useState<Date>();
  const [selectedCadets, setSelectedCadets] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch active cadets for the school
  const { data: cadets = [], isLoading: cadetsLoading } = useQuery({
    queryKey: ['cadets', userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, grade, rank')
        .eq('school_id', userProfile.school_id)
        .eq('active', true)
        .in('role', ['cadet'])
        .order('last_name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.school_id
  });

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

  const handleCadetSelect = (cadetId: string) => {
    if (!selectedCadets.includes(cadetId)) {
      setSelectedCadets([...selectedCadets, cadetId]);
    }
  };

  const handleCadetRemove = (cadetId: string) => {
    setSelectedCadets(selectedCadets.filter(id => id !== cadetId));
  };

  const getSelectedCadetInfo = (cadetId: string) => {
    const cadet = cadets.find(c => c.id === cadetId);
    return cadet ? `${cadet.last_name}, ${cadet.first_name}` : 'Unknown Cadet';
  };

  const handleSave = async () => {
    if (!date) {
      toast.error('Please select an inspection date');
      return;
    }

    if (selectedCadets.length === 0) {
      toast.error('Please select at least one cadet');
      return;
    }

    // Filter to only include selected cadets with scores
    const selectedCadetData = cadetDataWithScores.filter(data => 
      selectedCadets.includes(data.cadetId)
    );

    if (selectedCadetData.length === 0) {
      toast.error('Please enter scores for the selected cadets');
      return;
    }

    const success = await saveUniformInspections(date, selectedCadetData);
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

  const isFormValid = date && selectedCadets.length > 0;

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
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Uniform Inspection Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Select Cadets</Label>
                <Select onValueChange={handleCadetSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cadets to inspect" />
                  </SelectTrigger>
                  <SelectContent>
                    {cadets
                      .filter(cadet => !selectedCadets.includes(cadet.id))
                      .map((cadet) => (
                        <SelectItem key={cadet.id} value={cadet.id}>
                          {cadet.last_name}, {cadet.first_name}
                          {cadet.grade && ` • ${cadet.grade}`}
                          {cadet.rank && ` • ${cadet.rank}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedCadets.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Cadets</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedCadets.map((cadetId) => (
                    <Badge key={cadetId} variant="secondary" className="flex items-center gap-1">
                      {getSelectedCadetInfo(cadetId)}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleCadetRemove(cadetId)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Inspection Scores</h3>
              
              {cadetsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : selectedCadets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Please select cadets to begin entering inspection scores
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedCadets.map((cadetId) => {
                    const cadet = cadets.find(c => c.id === cadetId);
                    if (!cadet) return null;
                    
                    const scores = getCadetScores(cadet.id);
                    return (
                      <Card key={cadet.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div>
                            <p className="font-medium">
                              {cadet.last_name}, {cadet.first_name}
                            </p>
                            {cadet.grade && <p className="text-sm text-muted-foreground">{cadet.grade}</p>}
                            {cadet.rank && <p className="text-sm text-muted-foreground">{cadet.rank}</p>}
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Grade (0-100)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={scores.grade}
                              onChange={(e) => updateCadetScore(cadet.id, 'grade', e.target.value)}
                              placeholder="Enter grade"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                              value={scores.notes}
                              onChange={(e) => updateCadetScore(cadet.id, 'notes', e.target.value)}
                              placeholder="Optional notes"
                              rows={2}
                            />
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleBack}>
                Cancel
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={resetData}>
                  Reset
                </Button>
                <Button onClick={handleSave} disabled={!isFormValid || saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Inspections
                </Button>
              </div>
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