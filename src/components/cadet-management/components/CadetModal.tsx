import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useCadetRoles } from '@/hooks/useCadetRoles';
import { useAuth } from '@/contexts/AuthContext';
import { useCadetPermissions } from '@/hooks/useModuleSpecificPermissions';
import { supabase } from '@/integrations/supabase/client';
import { getRanksForProgram, JROTCProgram } from '@/utils/jrotcRanks';
import { generateYearOptions } from '@/utils/yearOptions';
import { toast } from 'sonner';
import { Profile, NewCadet } from '../types';

interface CadetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit?: boolean;
  cadetData?: Profile | NewCadet;
  onSubmit: (data: any) => void;
  onRefresh?: () => void;
}

export const CadetModal: React.FC<CadetModalProps> = ({
  open,
  onOpenChange,
  isEdit = false,
  cadetData,
  onSubmit,
  onRefresh
}) => {
  const { roleOptions } = useCadetRoles();
  const { userProfile } = useAuth();
  const { canResetPassword } = useCadetPermissions();
  
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const initialData = isEdit && cadetData ? cadetData : {
    first_name: '',
    last_name: '',
    email: '',
    role_id: '',
    start_year: '',
    grade: '',
    rank: '',
    flight: '',
    cadet_year: ''
  };

  const [formData, setFormData] = useState(initialData);

  const {
    hasUnsavedChanges,
    resetChanges
  } = useUnsavedChanges({
    initialData,
    currentData: formData,
    enabled: open
  });

  // Update form data when cadet data changes
  useEffect(() => {
    if (cadetData && isEdit) {
      setFormData(cadetData);
      resetChanges();
    } else if (!isEdit) {
      setFormData(initialData);
      resetChanges();
    }
  }, [cadetData, isEdit, resetChanges]);

  // Clear email error when modal opens/closes
  useEffect(() => {
    if (!open) {
      setEmailError('');
    }
  }, [open]);

  const checkEmailExists = async (email: string): Promise<boolean> => {
    if (!email) return false;
    
    try {
      setIsCheckingEmail(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking email:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any existing email error first
    setEmailError('');
    
    // Check for required fields manually
    const requiredFields = ['first_name', 'last_name', 'email', 'role_id', 'start_year'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    // Debug logging
    console.log('Form data when submitting:', formData);
    console.log('Missing required fields:', missingFields);
    console.log('Required fields check:', {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      role_id: formData.role_id,
      start_year: formData.start_year
    });
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields. Missing: ${missingFields.join(', ')}`);
      return;
    }
    
    // Only check email for new cadets (not in edit mode)
    if (!isEdit && formData.email) {
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        setEmailError('Email already exists, enter a new email');
        return;
      }
    }
    
    await onSubmit(formData);
    resetChanges();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleDiscardChanges = () => {
    resetChanges();
    setShowUnsavedDialog(false);
    onOpenChange(false);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(open);
    }
  };

  const handleResetPassword = async () => {
    if (!isEdit || !cadetData || !('id' in cadetData)) return;
    
    try {
      setIsResettingPassword(true);
      const { data, error } = await supabase.functions.invoke('reset-cadet-password', {
        body: { cadetId: cadetData.id }
      });

      if (error) throw error;

      setNewPassword(data.password);
      setShowPassword(true);
      toast.success('Password reset successfully');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const ranks = userProfile?.schools?.jrotc_program 
    ? getRanksForProgram(userProfile.schools.jrotc_program as JROTCProgram) 
    : [];

  const yearOptions = generateYearOptions();

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Edit Cadet' : 'Add Cadet'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Enter first name"
                  required
                  readOnly={isEdit}
                  className={isEdit ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Enter last name"
                  required
                  readOnly={isEdit}
                  className={isEdit ? 'bg-muted' : ''}
                />
              </div>
            </div>

            {/* Email and Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    // Clear email error when user starts typing
                    if (emailError) setEmailError('');
                  }}
                  placeholder="Enter email address"
                  required
                  readOnly={isEdit}
                  className={isEdit ? 'bg-muted' : (emailError ? 'border-destructive' : '')}
                />
                {emailError && (
                  <p className="text-sm text-destructive mt-1">{emailError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Start Year and Grade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_year">Start Year</Label>
                <Select
                  value={formData.start_year?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, start_year: parseInt(value) })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select start year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select
                  value={formData.grade || ''}
                  onValueChange={(value) => setFormData({ ...formData, grade: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9">9th Grade</SelectItem>
                    <SelectItem value="10">10th Grade</SelectItem>
                    <SelectItem value="11">11th Grade</SelectItem>
                    <SelectItem value="12">12th Grade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Flight, Cadet Year, and Rank */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flight">Flight</Label>
                <Select
                  value={formData.flight || ''}
                  onValueChange={(value) => setFormData({ ...formData, flight: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select flight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alpha">Alpha</SelectItem>
                    <SelectItem value="bravo">Bravo</SelectItem>
                    <SelectItem value="charlie">Charlie</SelectItem>
                    <SelectItem value="delta">Delta</SelectItem>
                    <SelectItem value="echo">Echo</SelectItem>
                    <SelectItem value="foxtrot">Foxtrot</SelectItem>
                    <SelectItem value="golf">Golf</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cadet_year">Cadet Year</Label>
                <Select
                  value={formData.cadet_year || ''}
                  onValueChange={(value) => setFormData({ ...formData, cadet_year: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cadet year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st</SelectItem>
                    <SelectItem value="2nd">2nd</SelectItem>
                    <SelectItem value="3rd">3rd</SelectItem>
                    <SelectItem value="4th">4th</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rank">Rank</Label>
                <Select
                  value={formData.rank || ''}
                  onValueChange={(value) => setFormData({ ...formData, rank: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent>
                    {ranks.map((rank) => (
                      <SelectItem key={rank.rank} value={rank.rank}>
                        {rank.rank} ({rank.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Password Reset Section - Only for Edit Mode */}
            {isEdit && canResetPassword && (
              <Accordion type="single" collapsible className="border rounded-lg">
                <AccordionItem value="password-reset" className="border-0">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    Password Reset
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Reset the cadet's password to a new randomly generated password.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleResetPassword}
                        disabled={isResettingPassword}
                        className="w-full"
                      >
                        {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reset Password
                      </Button>
                      
                      {newPassword && (
                        <div className="space-y-2">
                          <Label>New Password</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              value={newPassword}
                              readOnly
                              className="bg-muted"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Please provide this password to the cadet securely.
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-6">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {isEdit ? 'Update Cadet' : 'Create Cadet'}
              </Button>
            </div>
          </form>
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