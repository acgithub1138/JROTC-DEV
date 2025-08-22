
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
    role_id: '',
    grade: '',
    rank: '',
    flight: '',
    cadet_year: ''
  });

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (
            role_name,
            role_label
          )
        `)
        .eq('school_id', userProfile?.school_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out instructor profiles
      const filteredData = data?.filter(profile => 
        profile.user_roles?.role_name !== 'instructor'
      ) || [];
      
      setProfiles(filteredData);
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

  const handleAddCadet = async (e: React.FormEvent, onSuccess?: () => void) => {
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
      const { data, error } = await supabase.functions.invoke('create-cadet-user', {
        body: {
          email: newCadet.email,
          first_name: newCadet.first_name,
          last_name: newCadet.last_name,
          role_id: newCadet.role_id,
          grade: newCadet.grade || null,
          rank: newCadet.rank || null,
          flight: newCadet.flight || null,
          cadet_year: newCadet.cadet_year || null,
          school_id: userProfile?.school_id!
        }
      });

      if (error) {
        // Extract specific error message from edge function response
        let errorMessage = 'Failed to create cadet';
        
        // Debug: Log the full error structure
        console.log('Full error object:', error);
        console.log('Response data:', data);
        
        // Check for error in response data first (edge function return body)
        if (data && data.error) {
          errorMessage = data.error;
        } else if (error.details && typeof error.details === 'string') {
          // Parse stringified JSON details
          try {
            const parsed = JSON.parse(error.details);
            if (parsed.error) errorMessage = parsed.error;
          } catch {
            errorMessage = error.details;
          }
        } else if (error.details && error.details.error) {
          errorMessage = error.details.error;
        } else if (error.context && typeof error.context === 'string') {
          // Parse stringified JSON context
          try {
            const parsed = JSON.parse(error.context);
            if (parsed.error) errorMessage = parsed.error;
          } catch {
            errorMessage = error.context;
          }
        } else if (error.message && !error.message.includes('Edge Function returned a non-2xx status code')) {
          errorMessage = error.message;
        }
        
        // Check for specific error types and provide user-friendly messages
        if (errorMessage.includes('already been registered') || errorMessage.includes('email_exists') || errorMessage.includes('A user with this email address has already been registered')) {
          errorMessage = 'User email already exists. Please change it and try again.';
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: "Cadet Successfully Created",
        description: `${newCadet.first_name} ${newCadet.last_name} has been created with default password: Sh0wc@se`,
        duration: 8000
      });

      setNewCadet({
        first_name: '',
        last_name: '',
        email: '',
        role_id: '',
        grade: '',
        rank: '',
        flight: '',
        cadet_year: ''
      });
      
      fetchProfiles();
      
      // Close the modal on success
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating cadet:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create cadet",
        variant: "destructive"
      });
    }
  };

  const handleBulkImport = async (cadets: NewCadet[], onProgress?: (current: number, total: number) => void) => {
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
      // Process cadets sequentially to track progress
      for (let i = 0; i < cadets.length; i++) {
        const cadet = cadets[i];
        
        try {
          const { data, error } = await supabase.functions.invoke('create-cadet-user', {
            body: {
              email: cadet.email,
              first_name: cadet.first_name,
              last_name: cadet.last_name,
              role_id: cadet.role_id,
              grade: cadet.grade || null,
              rank: cadet.rank || null,
              flight: cadet.flight || null,
              cadet_year: cadet.cadet_year || null,
              school_id: userProfile?.school_id!
            }
          });

          if (error) {
            // Extract specific error message from edge function response
            let errorMessage = 'Unknown error';
            
            // Debug: Log the full error structure
            console.log('Bulk import error object:', error);
            console.log('Bulk import response data:', data);
            
            // Check for error in response data first (edge function return body)
            if (data && data.error) {
              errorMessage = data.error;
            } else if (error.details && typeof error.details === 'string') {
              // Parse stringified JSON details
              try {
                const parsed = JSON.parse(error.details);
                if (parsed.error) errorMessage = parsed.error;
              } catch {
                errorMessage = error.details;
              }
            } else if (error.details && error.details.error) {
              errorMessage = error.details.error;
            } else if (error.context && typeof error.context === 'string') {
              // Parse stringified JSON context
              try {
                const parsed = JSON.parse(error.context);
                if (parsed.error) errorMessage = parsed.error;
              } catch {
                errorMessage = error.context;
              }
            } else if (error.message && !error.message.includes('Edge Function returned a non-2xx status code')) {
              errorMessage = error.message;
            }
            
            // Check for specific error types and provide user-friendly messages
            if (errorMessage.includes('already been registered') || errorMessage.includes('email_exists') || errorMessage.includes('A user with this email address has already been registered')) {
              errorMessage = 'User email already exists. Please change it and try again.';
            }
            
            throw new Error(`${cadet.first_name} ${cadet.last_name} (${cadet.email}): ${errorMessage}`);
          }
          successCount++;
        } catch (error: any) {
          failedCount++;
          errors.push(error.message || `Failed to create ${cadet.first_name} ${cadet.last_name}`);
        }

        // Update progress
        if (onProgress) {
          onProgress(i + 1, cadets.length);
        }
      }

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
          cadet_year: editingProfile.cadet_year ? editingProfile.cadet_year as '1st' | '2nd' | '3rd' | '4th' : null,
          role_id: editingProfile.role_id,
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
