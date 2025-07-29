import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Key } from 'lucide-react';
import { User, UserRole, School } from '../types';
import { ProfileHistoryTab } from '@/components/cadet-management/components/ProfileHistoryTab';

interface UserEditDialogProps {
  user: User | null;
  schools: School[];
  allowedRoles: UserRole[];
  canResetPassword: (user: User) => boolean;
  isAdmin: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  onResetPassword: (userId: string, password: string) => Promise<void>;
}

export const UserEditDialog = ({
  user,
  schools,
  allowedRoles,
  canResetPassword,
  isAdmin,
  open,
  onOpenChange,
  onUpdateUser,
  onResetPassword,
}: UserEditDialogProps) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetConfirmOpen, setPasswordResetConfirmOpen] = useState(false);

  React.useEffect(() => {
    if (user && open) {
      setEditingUser({ ...user });
      setNewPassword('');
      setShowPassword(false);
    }
  }, [user, open]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    await onUpdateUser(editingUser.id, editingUser);
    onOpenChange(false);
  };

  const handlePasswordReset = async () => {
    if (!editingUser || !newPassword) return;

    setPasswordResetLoading(true);
    try {
      await onResetPassword(editingUser.id, newPassword);
      setNewPassword('');
      setPasswordResetConfirmOpen(false);
      setShowPassword(false);
    } finally {
      setPasswordResetLoading(false);
    }
  };

  if (!editingUser) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="edit" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">Edit Profile</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-hidden">
                <TabsContent value="edit" className="h-full overflow-auto mt-0 p-0">
                  <div className="h-full overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-firstName">First Name</Label>
                          <Input
                            id="edit-firstName"
                            value={editingUser.first_name}
                            onChange={(e) => setEditingUser({
                              ...editingUser,
                              first_name: e.target.value
                            })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-lastName">Last Name</Label>
                          <Input
                            id="edit-lastName"
                            value={editingUser.last_name}
                            onChange={(e) => setEditingUser({
                              ...editingUser,
                              last_name: e.target.value
                            })}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editingUser.email}
                          onChange={(e) => setEditingUser({
                            ...editingUser,
                            email: e.target.value
                          })}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-role">Role</Label>
                        <Select 
                          value={editingUser.role} 
                          onValueChange={(value: UserRole) => setEditingUser({
                            ...editingUser,
                            role: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {allowedRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {isAdmin && (
                        <div className="space-y-2">
                          <Label htmlFor="edit-school">School</Label>
                          <Select 
                            value={editingUser.school_id} 
                            onValueChange={(value) => setEditingUser({
                              ...editingUser,
                              school_id: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select school" />
                            </SelectTrigger>
                            <SelectContent>
                              {schools.map((school) => (
                                <SelectItem key={school.id} value={school.id}>
                                  {school.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Password Reset Section - Only for Admins */}
                      {canResetPassword(editingUser) && (
                        <>
                          <Separator className="my-6" />
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                              <Key className="w-4 h-4" />
                              Password Reset
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Reset the user's password. They will need to use the new password to sign in.
                            </p>
                            
                            <div className="space-y-2">
                              <Label htmlFor="new-password">New Password</Label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <Input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password (min 6 characters)"
                                    minLength={6}
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
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={generateRandomPassword}
                                >
                                  Generate
                                </Button>
                              </div>
                            </div>

                            {newPassword && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setPasswordResetConfirmOpen(true)}
                                className="w-full"
                              >
                                Reset Password
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          Update Profile
                        </Button>
                      </div>
                    </form>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="h-full overflow-auto mt-0 p-0">
                  <div className="h-full overflow-y-auto">
                    <ProfileHistoryTab profileId={editingUser.id} />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Confirmation Dialog */}
      {passwordResetConfirmOpen && (
        <Dialog open={passwordResetConfirmOpen} onOpenChange={setPasswordResetConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset User Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Are you sure you want to reset the password for {editingUser?.first_name} {editingUser?.last_name}?
                <br /><br />
                <strong>The user will need to use the new password to sign in.</strong>
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setPasswordResetConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordReset}
                  disabled={passwordResetLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {passwordResetLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};