import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Key, Eye, EyeOff, UserPlus, GraduationCap, Users, Shield } from 'lucide-react';
import { DynamicRole } from '@/hooks/useDynamicRoles';
import { School } from './types';

interface UserFormProps {
  userData: {
    first_name: string;
    last_name: string;
    email: string;
    role_id: string;
    school_id: string;
    password: string;
    active: boolean;
  };
  onUserDataChange: (updater: (prev: any) => any) => void;
  onSubmit: (e: React.FormEvent) => void;
  allowedRoles: DynamicRole[];
  schools: School[];
  mode: string;
  canEditSchool: () => boolean;
  canResetPassword: boolean;
  userId?: string;
  newPassword: string;
  setNewPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  setPasswordResetConfirmOpen: (open: boolean) => void;
  generateRandomPassword: () => void;
  getRoleIcon: (role: any) => React.ReactNode;
}

const UserForm = React.memo(({
  userData,
  onUserDataChange,
  onSubmit,
  allowedRoles,
  schools,
  mode,
  canEditSchool,
  canResetPassword,
  userId,
  newPassword,
  setNewPassword,
  showPassword,
  setShowPassword,
  setPasswordResetConfirmOpen,
  generateRandomPassword,
  getRoleIcon
}: UserFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="first_name" className="text-right">First Name *</Label>
          <Input
            id="first_name"
            value={userData.first_name}
            onChange={(e) => onUserDataChange(prev => ({ ...prev, first_name: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name" className="text-right">Last Name *</Label>
          <Input
            id="last_name"
            value={userData.last_name}
            onChange={(e) => onUserDataChange(prev => ({ ...prev, last_name: e.target.value }))}
            required
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-right">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={userData.email}
          onChange={(e) => onUserDataChange(prev => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>

      {/* Password - Only for creation */}
      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="password" className="text-right">Password *</Label>
          <Input
            id="password"
            type="password"
            value={userData.password}
            onChange={(e) => onUserDataChange(prev => ({ ...prev, password: e.target.value }))}
            required
            minLength={6}
            placeholder="Minimum 6 characters"
          />
        </div>
      )}

      {/* Role Selection */}
      <div className="space-y-2">
        <Label htmlFor="role" className="text-right">Role *</Label>
        <Select 
          value={userData.role_id} 
          onValueChange={(value: string) => onUserDataChange(prev => ({ ...prev, role_id: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {allowedRoles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                <div className="flex items-center gap-2">
                  {getRoleIcon(role.role_name)}
                  <span>{role.role_label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* School Selection */}
      <div className="space-y-2">
        <Label htmlFor="school" className="text-right">School *</Label>
        <Select 
          value={userData.school_id} 
          onValueChange={(value) => onUserDataChange(prev => ({ ...prev, school_id: value }))}
          disabled={!canEditSchool() && schools.length === 1}
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

      {/* Password Reset Section - Only for edit mode and authorized users */}
      {mode === 'edit' && canResetPassword && userId && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              <h3 className="font-medium">Password Reset</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
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
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomPassword}
                >
                  Generate
                </Button>
                <Button
                  type="button"
                  onClick={() => setPasswordResetConfirmOpen(true)}
                  disabled={!newPassword}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Reset Password
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </form>
  );
});

UserForm.displayName = 'UserForm';

export default UserForm;