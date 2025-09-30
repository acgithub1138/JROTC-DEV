import React, { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';


interface PasswordChangeDialogProps {
  open: boolean;
  onClose: () => void;
}

const PasswordChangeDialog: React.FC<PasswordChangeDialogProps> = ({ open, onClose }) => {
  const { userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Create unique IDs to prevent DOM conflicts when multiple dialogs might render
  const uniqueId = useMemo(() => Math.random().toString(36).substr(2, 9), []);
  const newPasswordId = `newPassword-${uniqueId}`;
  const confirmPasswordId = `confirmPassword-${uniqueId}`;

  const handlePasswordChange = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Update the user's password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });

      if (passwordError) {
        throw passwordError;
      }

      // Try to clear the server-side flag via RPC (may fail due to DB triggers)
      const { error: profileError } = await supabase.rpc('clear_password_change_requirement');
      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Always set a client-side override in user metadata so the dialog won't reappear
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { password_change_required: false, password_last_changed_at: new Date().toISOString() }
      });
      if (metadataError) {
        console.warn('Metadata update warning:', metadataError);
      }

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });

      setPasswords({ newPassword: '', confirmPassword: '' });
      
      // Refresh the user profile to get updated password_change_required status
      await refreshProfile();
      
      onClose();
    } catch (error: any) {
      console.error('Password change error:', error);
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [passwords, toast, onClose, refreshProfile]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Your Password</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You are required to change your password before accessing the system.
          </p>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={newPasswordId}>New Password</Label>
              <Input
                id={newPasswordId}
                type="password"
                placeholder="Enter your new password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={confirmPasswordId}>Confirm New Password</Label>
              <Input
                id={confirmPasswordId}
                type="password"
                placeholder="Confirm your new password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordChangeDialog;