
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

  const handleBulkImport = async (cadets: NewCadet[], onProgress?: (current: number, total: number, currentBatch: number, totalBatches: number) => void) => {
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const BATCH_SIZE = 5; // Process 5 cadets at a time to respect rate limits
    const BATCH_DELAY = 2000; // 2 second delay between batches

    const batches = [];
    for (let i = 0; i < cadets.length; i += BATCH_SIZE) {
      batches.push(cadets.slice(i, i + BATCH_SIZE));
    }

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const processCadetWithRetry = async (cadet: NewCadet, maxRetries = 3): Promise<{ success: boolean; error?: string }> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
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

          if (error) {
            // Check if it's a rate limit error
            if (error.message?.includes('rate limit') || error.message?.includes('429')) {
              if (attempt < maxRetries) {
                await sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
                continue;
              }
            }
            throw new Error(`${cadet.first_name} ${cadet.last_name} (${cadet.email}): ${error.message || 'Unknown error'}`);
          }
          
          return { success: true };
        } catch (error: any) {
          if (attempt === maxRetries) {
            return { success: false, error: error.message };
          }
          // Wait before retry
          await sleep(Math.pow(2, attempt) * 1000);
        }
      }
      return { success: false, error: 'Max retries exceeded' };
    };

    try {
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        // Process current batch
        const batchPromises = batch.map(cadet => processCadetWithRetry(cadet));
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Process results
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success) {
            successCount++;
          } else {
            failedCount++;
            const errorMsg = result.status === 'fulfilled' 
              ? result.value.error 
              : `Failed to create ${batch[index].first_name} ${batch[index].last_name}`;
            if (errorMsg) errors.push(errorMsg);
          }
        });

        // Update progress
        const currentProcessed = (batchIndex + 1) * BATCH_SIZE;
        const totalProcessed = Math.min(currentProcessed, cadets.length);
        onProgress?.(totalProcessed, cadets.length, batchIndex + 1, batches.length);

        // Add delay between batches (except for the last batch)
        if (batchIndex < batches.length - 1) {
          await sleep(BATCH_DELAY);
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
