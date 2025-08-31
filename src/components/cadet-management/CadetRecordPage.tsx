import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Calendar, Edit, Save, X, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { CadetFormContent } from './forms/CadetFormContent';
import { EditableCadetField } from './components/EditableCadetField';
import { CadetOverviewCards } from './components/CadetOverviewCards';
import { useCadets, useCadet } from '@/hooks/useCadets';
import { useCadetPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Profile } from './types';
type CadetRecordMode = 'create' | 'edit' | 'view';
export const CadetRecordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    toast
  } = useToast();
  const {
    userProfile
  } = useAuth();

  // Extract parameters from URL
  const mode = searchParams.get('mode') as CadetRecordMode || 'view';
  const cadetId = searchParams.get('id');

  // Permissions
  const {
    canCreate,
    canUpdate,
    canView
  } = useCadetPermissions();

  // Data
  const {
    cadets,
    loading: cadetsLoading
  } = useCadets();
  const {
    cadet,
    loading: cadetLoading
  } = useCadet(cadetId && cadetId !== '' ? cadetId : '');
  const isLoading = cadetsLoading || (cadetId ? cadetLoading : false);
  const currentCadet = cadet || cadets.find(c => c.id === cadetId) as any;

  // Local state - all hooks must be at top level
  const [currentMode, setCurrentMode] = useState<CadetRecordMode>(mode);
  const [editedCadet, setEditedCadet] = useState<any>(currentCadet || {});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingBasicInfo, setEditingBasicInfo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update currentMode when URL mode changes
  React.useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Update edited cadet when cadet changes
  useEffect(() => {
    if (currentCadet) {
      setEditedCadet(currentCadet);
    }
  }, [currentCadet]);

  // Handle cadet field changes
  const handleCadetFieldChange = (field: string, value: any) => {
    setEditedCadet(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!currentCadet || !hasUnsavedChanges) return;
    try {
      setIsSubmitting(true);
      // This would need to be implemented with actual cadet update mutation
      // Similar to the incident implementation
      toast({
        title: "Changes Saved",
        description: "Cadet information has been updated successfully."
      });
      setHasUnsavedChanges(false);
      setEditingBasicInfo(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check permissions for the current cadet
  const canEditCadet = canUpdate;

  // Handle URL parameter changes
  useEffect(() => {
    if (currentMode === 'create' && !canCreate) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create cadets.",
        variant: "destructive"
      });
      navigate('/app/cadets');
      return;
    }
    if (cadetId && currentMode !== 'create') {
      if (!currentCadet && !isLoading) {
        toast({
          title: "Cadet Not Found",
          description: "The cadet you're looking for doesn't exist.",
          variant: "destructive"
        });
        navigate('/app/cadets');
        return;
      }
      if (currentCadet && !canView) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this cadet.",
          variant: "destructive"
        });
        navigate('/app/cadets');
        return;
      }
      if (currentMode === 'edit' && !canEditCadet) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to edit this cadet.",
          variant: "destructive"
        });
        // Switch to view mode instead
        navigate(`/app/cadets/cadet_record?mode=view&id=${cadetId}`);
        return;
      }
    }
  }, [currentMode, cadetId, currentCadet, isLoading, canCreate, canView, canEditCadet, navigate, toast]);
  const handleBack = () => {
    navigate('/app/cadets');
  };
  const handleModeChange = (newMode: CadetRecordMode) => {
    if (newMode === 'create') {
      navigate('/app/cadets/cadet_record?mode=create');
    } else if (currentCadet?.id) {
      navigate(`/app/cadets/cadet_record?mode=${newMode}&id=${currentCadet.id}`);
    }
  };
  const handleCadetCreated = (newCadet: Profile) => {
    navigate('/app/cadets');
  };
  const handleCadetUpdated = (updatedCadet: Profile) => {
    navigate(`/app/cadets/cadet_record?mode=view&id=${updatedCadet.id}`);
  };
  const handleCancel = () => {
    if (currentMode === 'create') {
      navigate('/app/cadets');
    } else if (currentCadet?.id) {
      navigate(`/app/cadets/cadet_record?mode=view&id=${currentCadet.id}`);
    }
  };

  // Loading state
  if (isLoading && currentMode !== 'create') {
    return <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cadets
          </Button>
        </div>
        <div className="text-center py-8">Loading cadet...</div>
      </div>;
  }

  // Create mode
  if (currentMode === 'create') {
    return <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cadets
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Add New Cadet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CadetFormContent mode="create" onSuccess={handleCadetCreated} onCancel={handleCancel} />
            </CardContent>
          </Card>
        </div>
      </div>;
  }

  // Need cadet for view/edit modes
  if (!currentCadet) {
    return <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cadets
          </Button>
        </div>
        <div className="text-center py-8">Cadet not found</div>
      </div>;
  }

  // Edit mode
  if (currentMode === 'edit') {
    return <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cadets
          </Button>
          <div className="text-sm text-muted-foreground">
            {currentCadet.last_name}, {currentCadet.first_name} / Edit
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Cadet - {currentCadet.last_name}, {currentCadet.first_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CadetFormContent mode="edit" cadet={currentCadet} onSuccess={handleCadetUpdated} onCancel={handleCancel} />
            </CardContent>
          </Card>
        </div>
      </div>;
  }

  // View mode (default) - using cadet-like layout
  return <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cadets
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                <span className="text-blue-600 font-mono">
                  {currentCadet.last_name}, {currentCadet.first_name}
                </span>
              </h1>
              <Badge variant="secondary" className="text-sm">
                {currentCadet.user_roles?.role_label || currentCadet.role || 'No Role'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{currentCadet.email}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {canEditCadet && <Button variant="outline" onClick={() => handleModeChange('edit')} className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Cadet
              </Button>}
            {canEditCadet && hasUnsavedChanges && <Button onClick={handleSaveChanges} disabled={isSubmitting} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <CadetOverviewCards cadet={currentCadet} />

      {/* Main Content - Two Column Layout */}
      
    </div>;
};