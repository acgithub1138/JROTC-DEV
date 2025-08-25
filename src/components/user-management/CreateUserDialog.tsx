
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, GraduationCap, Users, Shield } from 'lucide-react';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useToast } from '@/hooks/use-toast';

import { UserRole } from './types';

interface School {
  id: string;
  name: string;
}

interface CreateUserDialogProps {
  allowedRoles: UserRole[];
  trigger?: React.ReactNode;
  onUserCreated?: () => void;
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ allowedRoles, trigger, onUserCreated }) => {
  const { createUser, userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  
  const initialFormData = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: '' as UserRole | '',
    schoolId: '',
  };
  
  const [formData, setFormData] = useState(initialFormData);
  
  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: formData,
    enabled: open,
  });

  const fetchSchools = async () => {
    try {
      // Admins can see all schools, others only see their own
      let query = supabase.from('schools').select('id, name').order('name', { ascending: true });
      
      // If not admin, filter to only current user's school
      if (userProfile?.role !== 'admin' && userProfile?.school_id) {
        query = query.eq('id', userProfile.school_id);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSchools();
      // Set default school to current user's school for non-admins
      setFormData(prev => ({
        ...prev,
        schoolId: userProfile?.role !== 'admin' ? (userProfile?.school_id || '') : ''
      }));
    }
  }, [open, userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role || !formData.schoolId) return;
    
    setLoading(true);
    
    try {
      // Use the edge function instead of direct createUser call to ensure proper role_id setup
      const { data, error } = await supabase.functions.invoke('create-cadet-user', {
        body: {
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
          school_id: formData.schoolId,
        },
      });

      if (error) {
        console.error('User creation error:', error);
        toast({
          title: "User Creation Failed",
          description: "There was an error creating the user. Please try again.",
          variant: "destructive",
        });
      } else if (data?.error) {
        console.error('User creation failed:', data.error);
        // Handle specific error messages
        let errorMessage = "Failed to create user. Please try again.";
        if (data.error.includes("admin-only roles")) {
          errorMessage = "You don't have permission to assign this role. Contact your administrator.";
        } else if (data.error.includes("already exists")) {
          errorMessage = "A user with this email already exists.";
        }
        toast({
          title: "User Creation Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        // Success
        toast({
          title: "User Created",
          description: "User has been created successfully.",
        });
        setFormData(initialFormData);
        resetChanges();
        setOpen(false);
        if (onUserCreated) {
          onUserCreated();
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'instructor': return <Shield className="w-4 h-4" />;
      case 'command_staff': return <Users className="w-4 h-4" />;
      case 'cadet': return <GraduationCap className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'parent': return <Users className="w-4 h-4" />;
      default: return <UserPlus className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'instructor': return 'Instructor';
      case 'command_staff': return 'Command Staff';
      case 'cadet': return 'Cadet';
      case 'admin': return 'Admin';
      case 'parent': return 'Parent';
      default: return role;
    }
  };

  const canEditSchool = () => {
    return userProfile?.role === 'admin';
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    setOpen(open);
  };

  const handleDiscardChanges = () => {
    setFormData(initialFormData);
    resetChanges();
    setShowUnsavedDialog(false);
    setOpen(false);
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
              minLength={6}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role">
                  {formData.role && (
                    <div className="flex items-center">
                      {getRoleIcon(formData.role)}
                      <span className="ml-2">{getRoleLabel(formData.role)}</span>
                    </div>
                  )}
                </SelectValue>
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

          <div className="space-y-2">
            <Label htmlFor="school">School</Label>
            <Select 
              value={formData.schoolId} 
              onValueChange={(value) => setFormData({ ...formData, schoolId: value })}
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
            {!canEditSchool() && (
              <p className="text-sm text-muted-foreground">
                You can only create users for your school
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
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

export default CreateUserDialog;
