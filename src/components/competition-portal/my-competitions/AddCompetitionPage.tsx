import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { AddressLookupField } from '@/components/calendar/components/AddressLookupField';
import { ArrowLeft, Save } from 'lucide-react';
import { useCompetitions } from './hooks/useCompetitions';
import { useCompetitionPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useToast } from '@/hooks/use-toast';
import { JROTC_PROGRAM_OPTIONS } from './utils/constants';
import type { Competition } from './types';

interface FormData {
  name: string;
  description: string;
  location: string;
  competition_date: string;
  comp_type: 'air_force' | 'army' | 'coast_guard' | 'navy' | 'marine_corps' | 'space_force';
}

const initialFormData: FormData = {
  name: '',
  description: '',
  location: '',
  competition_date: '',
  comp_type: 'air_force',
};

export const AddCompetitionPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const competitionId = searchParams.get('id');
  const mode = (searchParams.get('mode') as 'create' | 'edit' | 'view') || 'create';
  
  const { canCreate, canUpdate } = useCompetitionPermissions();
  const { competitions, createCompetition, updateCompetition, isLoading: competitionsLoading } = useCompetitions();
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Get existing competition data for edit/view modes
  const existingCompetition = competitionId ? competitions.find(comp => comp.id === competitionId) : null;
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';

  // Set up unsaved changes tracking
  const initialData = existingCompetition ? {
    name: existingCompetition.name || '',
    description: existingCompetition.description || '',
    location: existingCompetition.location || '',
    competition_date: existingCompetition.competition_date ? new Date(existingCompetition.competition_date).toISOString().split('T')[0] : '',
    comp_type: (existingCompetition as any)?.comp_type || 'air_force',
  } : initialFormData;

  // Handle unsaved changes in view mode
  const shouldTrackChanges = !isViewMode;
  const { hasUnsavedChanges } = useUnsavedChanges({
    initialData: shouldTrackChanges ? initialData : formData,
    currentData: formData
  });

  // Reinitialize form data when competition data becomes available
  useEffect(() => {
    if (existingCompetition && (isEditMode || isViewMode)) {
      const updatedData: FormData = {
        name: existingCompetition.name || '',
        description: existingCompetition.description || '',
        location: existingCompetition.location || '',
        competition_date: existingCompetition.competition_date ? new Date(existingCompetition.competition_date).toISOString().split('T')[0] : '',
        comp_type: (existingCompetition as any)?.comp_type || 'air_force',
      };
      setFormData(updatedData);
    }
  }, [existingCompetition, isEditMode, isViewMode]);

  // Show loading state while waiting for data
  if ((isEditMode || isViewMode) && competitionId && !existingCompetition && competitionsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Check permissions
  if (isCreateMode && !canCreate) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">You don't have permission to create competitions.</p>
        </div>
      </div>
    );
  }

  if (isEditMode && !canUpdate) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">You don't have permission to edit competitions.</p>
        </div>
      </div>
    );
  }

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationSelect = (selectedLocation: string) => {
    updateFormData('location', selectedLocation);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isViewMode) return;

    try {
      setIsSubmitting(true);
      
      const submissionData = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        competition_date: formData.competition_date,
        comp_type: formData.comp_type,
      };

      if (isEditMode && competitionId) {
        await updateCompetition(competitionId, submissionData);
        toast({
          title: "Success",
          description: "Competition updated successfully.",
        });
      } else {
        await createCompetition(submissionData);
        toast({
          title: "Success", 
          description: "Competition created successfully.",
        });
      }

      // Navigate back to competitions list
      navigate('/app/competition-portal/my-competitions');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to save competition. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      setPendingNavigation('/app/competition-portal/my-competitions');
    } else {
      navigate('/app/competition-portal/my-competitions');
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const getPageTitle = () => {
    if (isViewMode) return `View Competition - ${existingCompetition?.name || 'Competition'}`;
    if (isEditMode) return `Edit Competition - ${existingCompetition?.name || 'Competition'}`;
    return 'Add Competition';
  };

  const canEdit = (isCreateMode && canCreate) || (isEditMode && canUpdate);

  return (
    <div className="p-6 space-y-6">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to Competitions
          </Button>
          <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleBack}>
              Cancel
            </Button>
            <Button type="submit" form="competition-form" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Competition')}
            </Button>
          </div>
        )}
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Competition Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="competition-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Competition Name and JROTC Program */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label htmlFor="name" className="text-right">Competition Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  required
                  disabled={isViewMode}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label htmlFor="comp_type" className="text-right">JROTC Program *</Label>
                <Select 
                  value={formData.comp_type} 
                  onValueChange={(value) => updateFormData('comp_type', value)}
                  disabled={isViewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select JROTC Program" />
                  </SelectTrigger>
                  <SelectContent>
                    {JROTC_PROGRAM_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Competition Date and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label htmlFor="competition_date" className="text-right">Competition Date *</Label>
                <Input
                  id="competition_date"
                  type="date"
                  value={formData.competition_date}
                  onChange={(e) => updateFormData('competition_date', e.target.value)}
                  required
                  disabled={isViewMode}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                <Label htmlFor="location" className="text-right">Location</Label>
                <AddressLookupField
                  value={formData.location}
                  onValueChange={handleLocationSelect}
                  placeholder="Search for a location"
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start">
              <Label htmlFor="description" className="text-right pt-2">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={4}
                disabled={isViewMode}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={() => {
          setShowUnsavedDialog(false);
          setPendingNavigation(null);
        }}
      />
    </div>
  );
};