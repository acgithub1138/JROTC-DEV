
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

  const handleSaveProfile = async (editingProfile: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          grade: editingProfile.grade || null,
          rank: editingProfile.rank || null,
          flight: editingProfile.flight || null,
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
    handleSaveProfile,
    fetchProfiles
  };
};
