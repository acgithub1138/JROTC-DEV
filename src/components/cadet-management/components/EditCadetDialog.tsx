
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getRanksForProgram, JROTCProgram } from '@/utils/jrotcRanks';
import { useUserPermissions } from '@/components/user-management/hooks/useUserPermissions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '../types';
import { gradeOptions, flightOptions, roleOptions } from '../constants';

interface EditCadetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProfile: Profile | null;
  setEditingProfile: (profile: Profile | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EditCadetDialog = ({ open, onOpenChange, editingProfile, setEditingProfile, onSubmit }: EditCadetDialogProps) => {
  const { userProfile } = useAuth();
  const { canResetPassword } = useUserPermissions();
  const { toast } = useToast();
  const ranks = getRanksForProgram(userProfile?.schools?.jrotc_program as JROTCProgram);
  
  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Cadet Information</DialogTitle>
          <DialogDescription>
            Update the cadet's grade, rank, and flight information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Select
                value={editingProfile.grade || ""}
                onValueChange={(value) => setEditingProfile({ ...editingProfile, grade: value })}
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
                value={editingProfile.flight || ""}
                onValueChange={(value) => setEditingProfile({ ...editingProfile, flight: value })}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={editingProfile.role || ""}
              onValueChange={(value) => setEditingProfile({ ...editingProfile, role: value })}
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
              value={editingProfile.rank || ""}
              onValueChange={(value) => setEditingProfile({ ...editingProfile, rank: value === "none" ? "" : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No rank</SelectItem>
                {ranks.map((rank) => (
                  <SelectItem key={rank.id} value={rank.rank || "none"}>
                    {rank.rank} {rank.abbreviation && `(${rank.abbreviation})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Update Cadet
            </Button>
          </div>
        </form>

        {/* Password Reset Section */}
        {canResetPassword(userForPermissionCheck) && (
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
  );
};
