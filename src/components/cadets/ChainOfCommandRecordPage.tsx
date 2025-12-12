import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useJobBoard } from '@/components/job-board/hooks/useJobBoard';
import { useJobBoardRoles } from '@/components/job-board/hooks/useJobBoardRoles';
import { useJobBoardPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useRoleValidation } from '@/components/job-board/hooks/useRoleValidation';
import { JobBoardWithCadet, NewJobBoard } from '@/components/job-board/types';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { TwoColumnGrid } from '@/components/ui/layout';

type ChainOfCommandRecordMode = 'create' | 'edit';

export const ChainOfCommandRecordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userProfile } = useAuth();

  // Extract mode and record ID from URL parameters
  const mode = (searchParams.get('mode') as ChainOfCommandRecordMode) || 'create';
  const recordId = searchParams.get('id');

  // State management
  const [record, setRecord] = useState<JobBoardWithCadet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string>('');

  // Form data state
  const [formData, setFormData] = useState<NewJobBoard>({
    cadet_id: '',
    role: '',
    email_address: '',
    reports_to: '',
    assistant: ''
  });

  // Hooks for data fetching
  const { users: cadets } = useSchoolUsers(true); // Only active cadets
  const { roles } = useJobBoardRoles();
  const { jobs, createJob, updateJob } = useJobBoard();
  const { canCreate, canUpdate } = useJobBoardPermissions();
  const { checkRoleUniqueness, isChecking } = useRoleValidation();

  // Load record data for edit mode
  useEffect(() => {
    const loadRecord = async () => {
      if (mode === 'edit' && recordId) {
        setIsLoading(true);
        try {
          const foundJob = jobs.find(job => job.id === recordId);
          if (foundJob) {
            setRecord(foundJob);
            setFormData({
              cadet_id: foundJob.cadet_id || 'unassigned',
              role: foundJob.role,
              email_address: foundJob.email_address || '',
              reports_to: foundJob.reports_to || '',
              assistant: foundJob.assistant || ''
            });
          } else {
            toast({
              title: "Error",
              description: "Chain of Command record not found.",
              variant: "destructive"
            });
            navigate('/app/job-board');
          }
        } catch (error) {
          console.error('Error loading record:', error);
          toast({
            title: "Error",
            description: "Failed to load Chain of Command record.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (jobs.length > 0) {
      loadRecord();
    }
  }, [mode, recordId, jobs, navigate, toast]);

  // Handle form field changes
  const handleFieldChange = (field: keyof NewJobBoard, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Handle mutual exclusivity of reports_to and assistant
      if (field === 'reports_to' && value !== 'NA' && value !== '') {
        newData.assistant = 'NA';
      } else if (field === 'assistant' && value !== 'NA' && value !== '') {
        newData.reports_to = 'NA';
      }
      
      return newData;
    });
    setHasUnsavedChanges(true);

    // Clear role error when role field changes
    if (field === 'role') {
      setRoleError('');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.role || !formData.reports_to || !formData.assistant) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Check for role validation errors
    if (roleError) {
      toast({
        title: "Validation Error",
        description: roleError,
        variant: "destructive"
      });
      return;
    }

    // Final role uniqueness check before submission
    const excludeJobId = mode === 'edit' && record ? record.id : undefined;
    const { isUnique, error } = await checkRoleUniqueness(formData.role.trim(), excludeJobId);
    
    if (error) {
      setRoleError(error);
      return;
    }
    
    if (!isUnique) {
      setRoleError("Role already exists, please change.");
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        cadet_id: formData.cadet_id === 'unassigned' || formData.cadet_id === '' ? undefined : formData.cadet_id,
        reports_to: formData.reports_to || undefined,
        assistant: formData.assistant || undefined
      };

      if (mode === 'create') {
        await createJob.mutateAsync(submitData);
        toast({
          title: "Success",
          description: "Chain of Command record created successfully."
        });
      } else if (mode === 'edit' && record) {
        await updateJob.mutateAsync({
          id: record.id,
          updates: submitData
        });
        toast({
          title: "Success",
          description: "Chain of Command record updated successfully."
        });
      }

      setHasUnsavedChanges(false);
      navigate('/app/job-board');
    } catch (error) {
      console.error('Error saving record:', error);
      toast({
        title: "Error",
        description: `Failed to ${mode === 'create' ? 'create' : 'update'} Chain of Command record.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle navigation with unsaved changes check
  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowUnsavedDialog(true);
    } else {
      navigate(path);
    }
  };

  const handleBack = () => {
    handleNavigation('/app/job-board');
  };

  const handleDiscardChanges = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  // Permission checks
  const hasPermission = mode === 'create' ? canCreate : canUpdate;
  
  if (!hasPermission) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to {mode === 'create' ? 'create' : 'edit'} Chain of Command records.
          </p>
        </div>
      </div>
    );
  }

  // Helper functions
  const formatCadetName = (cadet: any) => {
    return `${cadet.last_name}, ${cadet.first_name}${cadet.rank ? ` - ${cadet.rank}` : ''}`;
  };

  const activeCadets = cadets.filter(cadet => cadet.active).sort((a, b) => a.last_name.localeCompare(b.last_name));

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chain of Command
        </Button>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">
            {mode === 'create' ? 'Add New Role' : 'Edit Role'}
          </h1>
          
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !hasUnsavedChanges || !formData.role || !formData.reports_to || !formData.assistant}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Role' : 'Update Role'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto">
        <Card>
        <CardHeader>
          <CardTitle>Role Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              {/* First row: Cadet and Role */}
              <TwoColumnGrid>
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
                  <Label htmlFor="cadet" className="sm:w-32 sm:text-right text-left sm:shrink-0">Cadet</Label>
                  <div className="flex-1">
                    <Select 
                      value={formData.cadet_id} 
                      onValueChange={value => handleFieldChange('cadet_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select cadet..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {activeCadets.map(cadet => (
                          <SelectItem key={cadet.id} value={cadet.id}>
                            {formatCadetName(cadet)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
                  <Label htmlFor="role" className="sm:w-32 sm:text-right text-left sm:shrink-0">Role *</Label>
                  <div className="flex-1">
                    <Input 
                      id="role" 
                      value={formData.role} 
                      onChange={e => handleFieldChange('role', e.target.value)}
                      placeholder="Enter job role..." 
                      required 
                      className={roleError ? "border-red-500" : ""}
                    />
                    {roleError && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>{roleError}</span>
                      </div>
                    )}
                    {isChecking && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Checking role availability...
                      </div>
                    )}
                  </div>
                </div>
              </TwoColumnGrid>

              {/* Second row: Reports To and Assistant */}
              <TwoColumnGrid>
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
                  <Label htmlFor="reports_to" className="sm:w-32 sm:text-right text-left sm:shrink-0">Reports To *</Label>
                  <div className="flex-1">
                    <Select 
                      value={formData.reports_to} 
                      onValueChange={value => handleFieldChange('reports_to', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NA">NA</SelectItem>
                        {[...roles].sort().map(role => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
                  <Label htmlFor="assistant" className="sm:w-32 sm:text-right text-left sm:shrink-0">Assistant *</Label>
                  <div className="flex-1">
                    <Select 
                      value={formData.assistant} 
                      onValueChange={value => handleFieldChange('assistant', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NA">NA</SelectItem>
                        {[...roles].sort().map(role => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TwoColumnGrid>

              {/* Third row: Email Address */}
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
                <Label htmlFor="email_address" className="sm:w-32 sm:text-right text-left sm:shrink-0">Email Address</Label>
                <div className="flex-1">
                  <Input 
                    id="email_address" 
                    type="email" 
                    value={formData.email_address} 
                    onChange={e => handleFieldChange('email_address', e.target.value)}
                    placeholder="Enter email address..." 
                  />
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleContinueEditing}
      />
    </div>
  );
};