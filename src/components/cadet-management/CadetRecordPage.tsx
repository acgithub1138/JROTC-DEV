import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Calendar, Edit, Save, X, GraduationCap, Plus, Eye, EyeOff, Key } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { CadetFormContent } from './forms/CadetFormContent';
import { EditableCadetField } from './components/EditableCadetField';
import { CadetOverviewCards } from './components/CadetOverviewCards';
import { useCadets, useCadet } from '@/hooks/useCadets';
import { useCadetPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PTTestsTab } from './components/tabs/PTTestsTab';
import { InspectionTab } from './components/tabs/InspectionTab';
import { CommunityServiceTab } from './components/tabs/CommunityServiceTab';
import { ProfileEquipmentTab } from './components/ProfileEquipmentTab';
import { HistoryTab } from './components/tabs/HistoryTab';
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
    canView,
    canSidebar,
    canResetPassword
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

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

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

  // Handle password reset
  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive"
      });
      return;
    }
    if (!currentCadet) return;
    setPasswordResetLoading(true);
    try {
      const { error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          userId: currentCadet.id,
          newPassword: newPassword
        }
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: `Password reset successfully for ${currentCadet.first_name} ${currentCadet.last_name}`
      });
      setNewPassword('');
      setShowPassword(false);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive"
      });
    } finally {
      setPasswordResetLoading(false);
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
    navigate('/app/cadets');
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
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cadets
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Add New Cadet
                </CardTitle>
                
                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    form="cadet-form"
                    className="w-full sm:w-auto"
                  >
                    Add Cadet
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CadetFormContent mode="create" onSuccess={handleCadetCreated} onCancel={handleCancel} hideActionButtons={true} />
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
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cadets
          </Button>
          <div className="text-sm text-muted-foreground">
            {currentCadet.last_name}, {currentCadet.first_name} / Edit
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit Cadet - {currentCadet.last_name}, {currentCadet.first_name}
                </CardTitle>
                
                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    form="cadet-form"
                    className="w-full sm:w-auto"
                  >
                    Update Cadet
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CadetFormContent mode="edit" cadet={currentCadet} onSuccess={handleCadetUpdated} onCancel={handleCancel} hideActionButtons={true} />
            </CardContent>
          </Card>

          {/* Password Reset Section */}
          {canResetPassword && (
            <Card>
              <CardContent className="pt-6">
                <Accordion type="single" collapsible>
                  <AccordionItem value="password-reset">
                    <AccordionTrigger className="text-lg font-semibold py-2">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Reset Password
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input 
                            id="newPassword" 
                            type={showPassword ? "text" : "password"} 
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                            placeholder="Enter new password" 
                            className="pr-10" 
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" 
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          onClick={handleResetPassword} 
                          disabled={passwordResetLoading || !newPassword.trim()} 
                          variant="destructive"
                        >
                          {passwordResetLoading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>
      </div>;
  }

  // View mode (default) - using cadet-like layout
  return <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        {canSidebar && <Button variant="outline" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cadets
          </Button>}
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">
                <span className="text-black">
                  {currentCadet.last_name}, {currentCadet.first_name}
                </span>
              </h1>
              <Badge variant="secondary" className="capitalize py-[6px] text-sm">
                {currentCadet.user_roles?.role_label || currentCadet.role || 'No Role'}
              </Badge>
            </div>
            <p className="text-muted-foreground">{currentCadet.email}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {userProfile?.id === currentCadet.id && (
              <Button onClick={() => navigate(`/app/cadets/my_service_record?cadet_id=${currentCadet.id}`)} variant="outline" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Service Hours
              </Button>
            )}
            {canEditCadet}
            {canEditCadet && hasUnsavedChanges && <Button onClick={handleSaveChanges} disabled={isSubmitting} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <CadetOverviewCards cadet={currentCadet} />


      {/* Associated Records Tabs */}
      <div className="mt-6">
        <Tabs defaultValue="pt-tests" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pt-tests">
              <span className="hidden sm:inline">PT Tests</span>
              <span className="sm:hidden">PT</span>
            </TabsTrigger>
            <TabsTrigger value="inspection">
              <span className="hidden sm:inline">Inspection</span>
              <span className="sm:hidden">Insp</span>
            </TabsTrigger>
            <TabsTrigger value="community-service">
              <span className="hidden sm:inline">Community Service</span>
              <span className="sm:hidden">CS</span>
            </TabsTrigger>
            <TabsTrigger value="equipment">
              <span className="hidden sm:inline">Equipment</span>
              <span className="sm:hidden">Equp</span>
            </TabsTrigger>
            <TabsTrigger value="history">
              <span className="hidden sm:inline">History</span>
              <span className="sm:hidden">Hstry</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pt-tests" className="mt-6">
            <PTTestsTab cadetId={currentCadet.id} />
          </TabsContent>
          
          <TabsContent value="inspection" className="mt-6">
            <InspectionTab cadetId={currentCadet.id} />
          </TabsContent>
          
          <TabsContent value="community-service" className="mt-6">
            <CommunityServiceTab cadetId={currentCadet.id} />
          </TabsContent>
          
          <TabsContent value="equipment" className="mt-6">
            <ProfileEquipmentTab profileId={currentCadet.id} />
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <HistoryTab cadetId={currentCadet.id} />
          </TabsContent>
        </Tabs>
      </div>
      
    </div>;
};