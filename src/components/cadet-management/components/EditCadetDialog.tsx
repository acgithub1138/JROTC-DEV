import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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

const cadetSchema = z.object({
  grade: z.string(),
  flight: z.string(),
  cadet_year: z.string(),
  role_id: z.string(),
  rank: z.string(),
});

type CadetFormData = z.infer<typeof cadetSchema>;

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

  const initialData = {
    grade: editingProfile?.grade || '',
    flight: editingProfile?.flight || '',
    cadet_year: editingProfile?.cadet_year || '',
    role_id: editingProfile?.role_id || '',
    rank: editingProfile?.rank || '',
  };

  const form = useForm<CadetFormData>({
    resolver: zodResolver(cadetSchema),
    defaultValues: initialData,
  });

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData,
    currentData: form.watch(),
    enabled: open,
  });

  React.useEffect(() => {
    if (open && editingProfile) {
      // Reset form with cadet data when dialog opens
      form.reset({
        grade: editingProfile.grade || '',
        flight: editingProfile.flight || '',
        cadet_year: editingProfile.cadet_year || '',
        role_id: editingProfile.role_id || '',
        rank: editingProfile.rank || '',
      });
    }
  }, [open, editingProfile, form]);

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

  const handleSubmit = async (data: CadetFormData) => {
    if (!editingProfile) return;

    try {
      // Find the selected role to get the role_name
      const selectedRole = roleOptions.find(r => r.value === data.role_id);
      const roleName = selectedRole ? selectedRole.role_name : null;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          grade: data.grade || null,
          flight: data.flight || null,
          cadet_year: (data.cadet_year || null) as any,
          role_id: data.role_id || null,
          role: roleName as any, // Update role field with role_name
          rank: data.rank || null,
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
        ...data,
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!canUpdate}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No grade selected</SelectItem>
                          {gradeOptions.map(grade => (
                            <SelectItem key={grade} value={grade}>
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="flight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flight</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!canUpdate}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select flight" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No flight selected</SelectItem>
                          {flightOptions.map(flight => (
                            <SelectItem key={flight} value={flight}>
                              {flight}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cadet_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cadet Year</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!canUpdate}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No year selected</SelectItem>
                          {cadetYearOptions.map(year => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="role_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!canUpdate}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No role selected</SelectItem>
                        {roleOptions.map(roleOption => (
                          <SelectItem key={roleOption.value} value={roleOption.value}>
                            {roleOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rank</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!canUpdate}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No rank</SelectItem>
                        {ranks.map(rank => (
                          <SelectItem 
                            key={rank.id} 
                            value={rank.abbreviation ? `${rank.rank} (${rank.abbreviation})` : rank.rank || ''}
                          >
                            {rank.rank} {rank.abbreviation && `(${rank.abbreviation})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!canUpdate}>
                  Update Cadet
                </Button>
              </DialogFooter>
            </form>
          </Form>

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