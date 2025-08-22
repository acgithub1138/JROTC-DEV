import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getRanksForProgram, JROTCProgram } from '@/utils/jrotcRanks';
import { useCadetPermissions } from '@/hooks/useModuleSpecificPermissions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '../types';
import { gradeOptions, flightOptions, cadetYearOptions } from '../constants';
import { useCadetRoles } from '@/hooks/useCadetRoles';

interface EditCadetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProfile: Profile | null;
  setEditingProfile: (profile: Profile | null) => void;
  onRefresh?: () => void;
}

export const EditCadetDialog = ({
  open,
  onOpenChange,
  editingProfile,
  setEditingProfile,
  onRefresh
}: EditCadetDialogProps) => {
  const { userProfile } = useAuth();
  const { canResetPassword, canUpdate } = useCadetPermissions();
  const { toast } = useToast();
  
  const ranks = getRanksForProgram(userProfile?.schools?.jrotc_program as JROTCProgram);
  const { roleOptions } = useCadetRoles();

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    grade: '',
    flight: '',
    cadet_year: '',
    role_id: '',
    rank: ''
  });
  const [initialFormData, setInitialFormData] = useState({
    grade: '',
    flight: '',
    cadet_year: '',
    role_id: '',
    rank: ''
  });

  // Debug the current form data state
  React.useEffect(() => {
    console.log('Current formData state:', formData);
  }, [formData]);

  // Initialize form data when dialog opens or editingProfile changes
  React.useEffect(() => {
    console.log('useEffect triggered - editingProfile:', editingProfile, 'open:', open);
    
    if (editingProfile && open) {
      // Convert null values to empty strings for Select components, with fallback to 'none'
      const data = {
        grade: editingProfile.grade || '',
        flight: editingProfile.flight || '',
        cadet_year: editingProfile.cadet_year || '',
        role_id: editingProfile.role_id || '',
        rank: editingProfile.rank || ''
      };
      
      console.log('Setting form data with:', data);
      console.log('Original editingProfile data:', {
        grade: editingProfile.grade,
        flight: editingProfile.flight,
        cadet_year: editingProfile.cadet_year,
        role_id: editingProfile.role_id,
        rank: editingProfile.rank
      });
      
      setFormData(data);
      setInitialFormData(data);
    } else if (!editingProfile || !open) {
      // Reset form when modal is closed or no cadet selected
      const emptyData = {
        grade: '',
        flight: '',
        cadet_year: '',
        role_id: '',
        rank: ''
      };
      setFormData(emptyData);
      setInitialFormData(emptyData);
    }
  }, [editingProfile, open]);

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: formData,
    enabled: open && !!editingProfile
  });

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      setPendingClose(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      setPendingClose(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscardChanges = () => {
    resetChanges();
    setShowUnsavedDialog(false);
    setPendingClose(false);
    onOpenChange(false);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
    setPendingClose(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    try {
      // Find the selected role to get the role_name
      const selectedRole = roleOptions.find(r => r.value === formData.role_id);
      const roleName = selectedRole ? selectedRole.role_name : null;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          grade: formData.grade || null,
          flight: formData.flight || null,
          cadet_year: (formData.cadet_year || null) as any,
          role_id: formData.role_id || null,
          role: roleName as any, // Update role field with role_name
          rank: formData.rank || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProfile.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated ${editingProfile.first_name} ${editingProfile.last_name}'s information`
      });

      // Update editingProfile with form data
      setEditingProfile({
        ...editingProfile,
        ...formData,
        role: roleName || editingProfile.role
      });
      
      resetChanges();
      onOpenChange(false);
      onRefresh?.();
      
      
    } catch (error) {
      console.error('Error updating cadet:', error);
      toast({
        title: "Error",
        description: "Failed to update cadet information",
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive"
      });
      return;
    }

    if (!editingProfile) return;

    setPasswordResetLoading(true);
    try {
      const { error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          userId: editingProfile.id,
          newPassword: newPassword
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Password reset successfully for ${editingProfile.first_name} ${editingProfile.last_name}`
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

  if (!editingProfile) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Cadet Information</DialogTitle>
            <DialogDescription>
              Update the cadet's grade, rank, and flight information.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  value={`${editingProfile.first_name} ${editingProfile.last_name}`} 
                  disabled 
                  className="bg-muted" 
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  value={editingProfile.email} 
                  disabled 
                  className="bg-muted" 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select 
                  value={formData.grade || 'none'} 
                  onValueChange={(value) => {
                    console.log('Grade changed to:', value);
                    setFormData({ ...formData, grade: value === 'none' ? '' : value });
                  }}
                  disabled={!canUpdate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No grade selected</SelectItem>
                    {gradeOptions.map(grade => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="flight">Flight</Label>
                <Select 
                  value={formData.flight || 'none'} 
                  onValueChange={(value) => setFormData({ ...formData, flight: value === 'none' ? '' : value })}
                  disabled={!canUpdate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select flight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No flight selected</SelectItem>
                    {flightOptions.map(flight => (
                      <SelectItem key={flight} value={flight}>
                        {flight}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cadet_year">Cadet Year</Label>
                <Select 
                  value={formData.cadet_year || 'none'} 
                  onValueChange={(value) => setFormData({ ...formData, cadet_year: value === 'none' ? '' : value })}
                  disabled={!canUpdate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No year selected</SelectItem>
                    {cadetYearOptions.map(year => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role_id">Role</Label>
              <Select 
                value={formData.role_id || 'none'} 
                onValueChange={(value) => setFormData({ ...formData, role_id: value === 'none' ? '' : value })}
                disabled={!canUpdate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No role selected</SelectItem>
                  {roleOptions.map(roleOption => (
                    <SelectItem key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rank">Rank</Label>
              <Select 
                value={formData.rank || 'none'} 
                onValueChange={(value) => setFormData({ ...formData, rank: value === 'none' ? '' : value })}
                disabled={!canUpdate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No rank</SelectItem>
                  {ranks.map(rank => (
                    <SelectItem 
                      key={rank.id} 
                      value={rank.abbreviation ? `${rank.rank} (${rank.abbreviation})` : rank.rank || 'none'}
                    >
                      {rank.rank} {rank.abbreviation && `(${rank.abbreviation})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canUpdate}>
                Update Cadet
              </Button>
            </DialogFooter>
          </form>

          {/* Password Reset Section */}
          {canResetPassword && (
            <Accordion type="single" collapsible className="mt-6">
              <AccordionItem value="password-reset">
                <AccordionTrigger className="text-lg font-semibold">
                  Reset Password
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Reset the cadet's password. They will need to use the new password to sign in.
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input 
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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
          )}
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog 
        open={showUnsavedDialog} 
        onOpenChange={setShowUnsavedDialog} 
        onDiscard={handleDiscardChanges} 
        onCancel={handleContinueEditing} 
      />
    </>
  );
};