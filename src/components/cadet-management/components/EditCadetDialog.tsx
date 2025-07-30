
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  onSubmit: (e: React.FormEvent) => void;
}

export const EditCadetDialog = ({ open, onOpenChange, editingProfile, setEditingProfile, onSubmit }: EditCadetDialogProps) => {
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
  
  // Separate form data state to prevent direct mutation of props
  const [formData, setFormData] = useState({
    grade: '',
    flight: '',
    cadet_year: '',
    role: '',
    rank: '',
  });
  
  const [initialFormData, setInitialFormData] = useState({
    grade: '',
    flight: '',
    cadet_year: '',
    role: '',
    rank: '',
  });

  // Initialize form data when dialog opens or editingProfile changes
  React.useEffect(() => {
    if (editingProfile && open) {
      const data = {
        grade: editingProfile.grade || '',
        flight: editingProfile.flight || '',
        cadet_year: editingProfile.cadet_year || '',
        role: editingProfile.role || '',
        rank: editingProfile.rank || '',
      };
      setFormData(data);
      setInitialFormData(data);
    }
  }, [editingProfile, open]);

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: formData,
    enabled: open && !!editingProfile,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update editingProfile with form data before submitting
    if (editingProfile) {
      setEditingProfile({
        ...editingProfile,
        ...formData,
      });
    }
    onSubmit(e);
    resetChanges();
  };

  if (!editingProfile) return null;

  // Convert Profile to User type for permission check
  const userForPermissionCheck = {
    id: editingProfile.id,
    first_name: editingProfile.first_name,
    last_name: editingProfile.last_name,
    email: editingProfile.email,
    role: editingProfile.role as any,
    school_id: userProfile?.school_id || '',
    active: editingProfile.active,
    created_at: editingProfile.created_at
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }

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
        description: `Password reset successfully for ${editingProfile.first_name} ${editingProfile.last_name}`,
      });
      
      setNewPassword('');
      setShowPassword(false);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setPasswordResetLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
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
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={editingProfile.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value) => setFormData({ ...formData, grade: value })}
                  disabled={!canUpdate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((grade) => (
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
                  value={formData.flight}
                  onValueChange={(value) => setFormData({ ...formData, flight: value })}
                  disabled={!canUpdate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select flight" />
                  </SelectTrigger>
                  <SelectContent>
                    {flightOptions.map((flight) => (
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
                  value={formData.cadet_year}
                  onValueChange={(value) => setFormData({ ...formData, cadet_year: value })}
                  disabled={!canUpdate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {cadetYearOptions.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                disabled={!canUpdate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((roleOption) => (
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
                value={formData.rank}
                onValueChange={(value) => setFormData({ ...formData, rank: value === "none" ? "" : value })}
                disabled={!canUpdate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No rank</SelectItem>
                  {ranks.map((rank) => (
                    <SelectItem 
                      key={rank.id} 
                      value={rank.abbreviation ? `${rank.rank} (${rank.abbreviation})` : rank.rank || "none"}
                    >
                      {rank.rank} {rank.abbreviation && `(${rank.abbreviation})`}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!canUpdate}>
                  Update Cadet
                </Button>
              </div>
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
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
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
