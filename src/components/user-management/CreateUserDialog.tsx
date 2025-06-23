
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, GraduationCap, Users, Shield } from 'lucide-react';

type UserRole = 'school_admin' | 'instructor' | 'nco' | 'cadet';

interface CreateUserDialogProps {
  allowedRoles: UserRole[];
  trigger?: React.ReactNode;
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ allowedRoles, trigger }) => {
  const { createUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: '' as UserRole | '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role) return;
    
    setLoading(true);
    
    const { error } = await createUser(formData.email, formData.password, {
      first_name: formData.firstName,
      last_name: formData.lastName,
      role: formData.role,
      school_id: userProfile?.school_id,
    });
    
    if (!error) {
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: '',
      });
      setOpen(false);
    }
    
    setLoading(false);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'instructor': return <Shield className="w-4 h-4" />;
      case 'nco': return <Users className="w-4 h-4" />;
      case 'cadet': return <GraduationCap className="w-4 h-4" />;
      default: return <UserPlus className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'instructor': return 'Instructor';
      case 'nco': return 'NCO (Command Staff)';
      case 'cadet': return 'Cadet';
      default: return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {allowedRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center">
                      {getRoleIcon(role)}
                      <span className="ml-2">{getRoleLabel(role)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
