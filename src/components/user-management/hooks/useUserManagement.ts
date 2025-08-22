import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, School } from '../types';

export const useUserManagement = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          role,
          created_at,
          school_id,
          active,
          password_change_required,
          schools (name),
          user_roles (role_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setSchools(data || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const handleToggleUserStatus = async (userId: string, active: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('toggle-user-status', {
        body: {
          userId: userId,
          active: active
        }
      });

      if (error) throw error;

      const user = users.find(u => u.id === userId);
      toast({
        title: "Success",
        description: `User ${user?.first_name} ${user?.last_name} has been ${active ? 'enabled' : 'disabled'}.`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: "Error",
        description: `Failed to ${active ? 'enable' : 'disable'} user`,
        variant: "destructive",
      });
    }
  };

  const handleBulkToggle = async (userIds: string[], active: boolean) => {
    let successCount = 0;
    let failedCount = 0;

    try {
      const promises = userIds.map(async (userId) => {
        const { error } = await supabase.functions.invoke('toggle-user-status', {
          body: {
            userId: userId,
            active: active
          }
        });
        if (error) throw error;
        return userId;
      });

      const results = await Promise.allSettled(promises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          failedCount++;
        }
      });

      toast({
        title: `Bulk ${active ? 'Enable' : 'Disable'} Complete`,
        description: `Successfully ${active ? 'enabled' : 'disabled'} ${successCount} users${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      });

      fetchUsers();
    } catch (error) {
      console.error(`Bulk ${active ? 'enable' : 'disable'} error:`, error);
      toast({
        title: "Error",
        description: `Failed to ${active ? 'enable' : 'disable'} users`,
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (userId: string, newPassword: string) => {
    try {
      const { error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          userId: userId,
          newPassword: newPassword
        }
      });

      if (error) throw error;

      const user = users.find(u => u.id === userId);
      toast({
        title: "Success",
        description: `Password reset successfully for ${user?.first_name} ${user?.last_name}`,
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      // Prepare update data
      const updateData: any = {
        first_name: updates.first_name,
        last_name: updates.last_name,
        email: updates.email,
        school_id: updates.school_id,
        password_change_required: updates.password_change_required,
      };

      // If role is being updated, look up the corresponding role_id
      if (updates.role) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('id')
          .eq('role_name', updates.role)
          .single();

        if (roleError) {
          console.error('Role lookup error:', roleError);
          throw new Error(`Invalid role: ${updates.role}`);
        }

        updateData.role_id = roleData.id;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User profile updated successfully",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user profile",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSchools();
  }, [userProfile]);

  return {
    users,
    schools,
    loading,
    fetchUsers,
    handleToggleUserStatus,
    handleBulkToggle,
    handleResetPassword,
    updateUser,
  };
};