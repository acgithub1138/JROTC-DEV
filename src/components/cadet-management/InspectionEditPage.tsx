import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UniformInspectionData {
  id: string;
  cadet_id: string;
  date: string;
  grade: number | null;
  notes: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    grade: string | null;
    rank: string | null;
  };
}

export const InspectionEditPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inspectionId = searchParams.get('id');
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    date: '',
    grade: '',
    notes: ''
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch inspection data
  const { data: inspection, isLoading } = useQuery({
    queryKey: ['uniform-inspection', inspectionId],
    queryFn: async (): Promise<UniformInspectionData | null> => {
      if (!inspectionId) return null;
      
      const { data, error } = await supabase
        .from('uniform_inspections')
        .select(`
          id,
          cadet_id,
          date,
          grade,
          notes,
          profiles!uniform_inspections_cadet_id_fkey (
            first_name,
            last_name,
            grade,
            rank
          )
        `)
        .eq('id', inspectionId)
        .single();

      if (error) {
        console.error('Error fetching inspection:', error);
        toast.error('Failed to load inspection data');
        return null;
      }

      return data as UniformInspectionData;
    },
    enabled: !!inspectionId
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updateData: { date: string; grade: number | null; notes: string | null }) => {
      const { error } = await supabase
        .from('uniform_inspections')
        .update(updateData)
        .eq('id', inspectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uniform-inspections'] });
      queryClient.invalidateQueries({ queryKey: ['uniform-inspection', inspectionId] });
      toast.success('Inspection updated successfully');
      setHasUnsavedChanges(false);
      navigate(-1);
    },
    onError: (error) => {
      console.error('Error updating inspection:', error);
      toast.error('Failed to update inspection');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('uniform_inspections')
        .delete()
        .eq('id', inspectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uniform-inspections'] });
      toast.success('Inspection deleted successfully');
      navigate(-1);
    },
    onError: (error) => {
      console.error('Error deleting inspection:', error);
      toast.error('Failed to delete inspection');
    }
  });

  // Initialize form data when inspection loads
  useEffect(() => {
    if (inspection) {
      setFormData({
        date: inspection.date,
        grade: inspection.grade?.toString() || '',
        notes: inspection.notes || ''
      });
    }
  }, [inspection]);

  // Check for unsaved changes
  useEffect(() => {
    if (!inspection) return;
    
    const hasChanges = 
      formData.date !== inspection.date ||
      formData.grade !== (inspection.grade?.toString() || '') ||
      formData.notes !== (inspection.notes || '');
    
    setHasUnsavedChanges(hasChanges);
  }, [formData, inspection]);

  const handleSave = async () => {
    const grade = formData.grade ? parseInt(formData.grade) : null;
    
    if (grade !== null && (grade < 0 || grade > 100)) {
      toast.error('Grade must be between 0 and 100');
      return;
    }

    updateMutation.mutate({
      date: formData.date,
      grade,
      notes: formData.notes || null
    });
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    setShowDeleteDialog(false);
    deleteMutation.mutate();
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
    navigate(-1);
  };

  const saveAndLeave = async () => {
    setShowConfirmDialog(false);
    await handleSave();
  };

  if (!inspectionId) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No inspection ID provided</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Back to Cadets
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Inspection not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Back to Cadets
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Back Button - Above Header */}
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cadets
        </Button>

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Edit Uniform Inspection</h1>
          <p className="text-muted-foreground">
            {inspection.profiles.last_name}, {inspection.profiles.first_name}
            {inspection.profiles.grade && ` • ${inspection.profiles.grade}`}
            {inspection.profiles.rank && ` • ${inspection.profiles.rank}`}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inspection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <Label htmlFor="inspection-date" className="w-32 text-right shrink-0">Inspection Date</Label>
                <Input
                  id="inspection-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-4">
                <Label htmlFor="grade" className="w-32 text-right shrink-0">Grade (0-100)</Label>
                <Input
                  id="grade"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.grade}
                  onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                  placeholder="Enter grade"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Label htmlFor="notes" className="w-32 text-right shrink-0 mt-2">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes about the inspection"
                rows={4}
                className="flex-1"
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:justify-between pt-4 border-t">
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              
              <Button variant="outline" onClick={handleBack}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending || !formData.date}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              Stay on Form
            </AlertDialogCancel>
            <Button onClick={confirmLeave} variant="outline">
              Leave Without Saving
            </Button>
            <AlertDialogAction onClick={saveAndLeave}>
              Save & Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inspection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this uniform inspection record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};