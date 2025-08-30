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
  const [customPassword, setCustomPassword] = useState('');
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      
      if (useCustomPassword) {
        // Validate custom password
        if (!customPassword || customPassword.length < 6) {
          toast.error('Password must be at least 6 characters long');
          return;
        }
        
        // Use the reset-user-password function with custom password
        const { error } = await supabase.functions.invoke('reset-user-password', {
          body: { 
            userId: cadetData.id,
            newPassword: customPassword
          }
        });

        if (error) throw error;
        
        toast.success('Password reset successfully');
        setCustomPassword('');
        setUseCustomPassword(false);
      } else {
        // Generate random password (existing functionality)
        const { data, error } = await supabase.functions.invoke('reset-cadet-password', {
          body: { cadetId: cadetData.id }
        });

        if (error) throw error;

        setNewPassword(data.password);
        setShowPassword(true);
        toast.success('Password reset successfully');
      }
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
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                  readOnly={isEdit}
                  className={isEdit ? 'bg-muted' : ''}
                />
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
                    <SelectItem value="Alpha">Alpha</SelectItem>
                    <SelectItem value="Bravo">Bravo</SelectItem>
                    <SelectItem value="Charlie">Charlie</SelectItem>
                    <SelectItem value="Delta">Delta</SelectItem>
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
                    <SelectItem value="LET-1">LET-1</SelectItem>
                    <SelectItem value="LET-2">LET-2</SelectItem>
                    <SelectItem value="LET-3">LET-3</SelectItem>
                    <SelectItem value="LET-4">LET-4</SelectItem>
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
                         Reset the cadet's password to a new randomly generated password or specify a custom password.
                       </p>
                       
                       {/* Password Type Selection */}
                       <div className="space-y-3">
                         <div className="flex items-center space-x-2">
                           <input
                             type="radio"
                             id="random-password"
                             name="password-type"
                             checked={!useCustomPassword}
                             onChange={() => setUseCustomPassword(false)}
                             className="h-4 w-4"
                           />
                           <Label htmlFor="random-password">Generate random password</Label>
                         </div>
                         <div className="flex items-center space-x-2">
                           <input
                             type="radio"
                             id="custom-password"
                             name="password-type"
                             checked={useCustomPassword}
                             onChange={() => setUseCustomPassword(true)}
                             className="h-4 w-4"
                           />
                           <Label htmlFor="custom-password">Specify custom password</Label>
                         </div>
                       </div>

                       {/* Custom Password Input */}
                       {useCustomPassword && (
                         <div className="space-y-2">
                           <Label htmlFor="custom-password-input">Custom Password</Label>
                           <div className="flex items-center space-x-2">
                             <Input
                               id="custom-password-input"
                               type={showPassword ? 'text' : 'password'}
                               value={customPassword}
                               onChange={(e) => setCustomPassword(e.target.value)}
                               placeholder="Enter custom password (min 6 characters)"
                               className="flex-1"
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
                           <p className="text-xs text-muted-foreground">
                             Password must be at least 6 characters long.
                           </p>
                         </div>
                       )}

                       {/* Reset Button */}
                       <Button
                         type="button"
                         variant="outline"
                         onClick={handleResetPassword}
                         disabled={isResettingPassword || (useCustomPassword && (!customPassword || customPassword.length < 6))}
                         className="w-full"
                       >
                         {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                         {useCustomPassword ? 'Set Custom Password' : 'Generate Random Password'}
                       </Button>
                       
                       {/* Display Generated Password */}
                       {newPassword && !useCustomPassword && (
                         <div className="space-y-2">
                           <Label>Generated Password</Label>
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