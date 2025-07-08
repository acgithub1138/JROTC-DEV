
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Profile, NewCadet } from '../types';

export const useCadetManagement = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('active');
  const [statusLoading, setStatusLoading] = useState(false);

  const [newCadet, setNewCadet] = useState<NewCadet>({
    first_name: '',
    last_name: '',
    email: '',
    role: 'cadet',
    grade: '',
    rank: '',
    flight: ''
  });

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('school_id', userProfile?.school_id)
        .in('role', ['cadet', 'command_staff'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cadets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (profile: Profile) => {
    setStatusLoading(true);
    try {
      const { error } = await supabase.functions.invoke('toggle-user-status', {
        body: {
          userId: profile.id,
          active: !profile.active
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Cadet ${profile.active ? 'deactivated' : 'activated'} successfully`
      });

      fetchProfiles();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: "Error",
        description: "Failed to update cadet status",
        variant: "destructive"
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAddCadet = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCadet.first_name || !newCadet.last_name || !newCadet.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('create-cadet-user', {
        body: {
          email: newCadet.email,
          first_name: newCadet.first_name,
          last_name: newCadet.last_name,
          role: newCadet.role,
          grade: newCadet.grade || null,
          rank: newCadet.rank || null,
          flight: newCadet.flight || null,
          school_id: userProfile?.school_id!
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Invitation email sent to ${newCadet.email}. They will receive an email to set up their account.`,
        duration: 8000
      });

      setNewCadet({
        first_name: '',
        last_name: '',
        email: '',
        role: 'cadet',
        grade: '',
        rank: '',
        flight: ''
      });
      
      fetchProfiles();
    } catch (error) {
      console.error('Error inviting cadet:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
    }
  };

  const handleBulkImport = async (cadets: NewCadet[]) => {
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
      // Create all cadet invitations in bulk using Promise.all for much better performance
      const promises = cadets.map(async (cadet) => {
        const { error } = await supabase.functions.invoke('create-cadet-user', {
          body: {
            email: cadet.email,
            first_name: cadet.first_name,
            last_name: cadet.last_name,
            role: cadet.role,
            grade: cadet.grade || null,
            rank: cadet.rank || null,
            flight: cadet.flight || null,
            school_id: userProfile?.school_id!
          }
        });

        if (error) throw new Error(`${cadet.first_name} ${cadet.last_name} (${cadet.email}): ${error.message || 'Unknown error'}`);
        return cadet;
      });

      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          failedCount++;
          errors.push(`Failed to create ${result.reason.message}`);
        }
      });

      if (successCount > 0) {
        toast({
          title: "Bulk Import Complete",
          description: `Successfully created ${successCount} cadets${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
          duration: 8000
        });
        fetchProfiles();
      }

      return { success: successCount, failed: failedCount, errors };
    } catch (error) {
      console.error('Bulk import error:', error);
      return { success: 0, failed: cadets.length, errors: ['Bulk import failed completely'] };
    }
  };

  const handleSaveProfile = async (editingProfile: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          grade: editingProfile.grade || null,
          rank: editingProfile.rank || null,
          flight: editingProfile.flight || null,
          role: editingProfile.role as 'cadet' | 'command_staff' | 'instructor' | 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProfile.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cadet updated successfully"
      });

      fetchProfiles();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update cadet",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (userProfile?.school_id) {
      fetchProfiles();
    }
  }, [userProfile?.school_id]);

  // Reset to first page when search term or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  return {
    profiles,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    activeTab,
    setActiveTab,
    statusLoading,
    newCadet,
    setNewCadet,
    handleToggleUserStatus,
    handleAddCadet,
    handleBulkImport,
    handleSaveProfile,
    fetchProfiles
  };
};
