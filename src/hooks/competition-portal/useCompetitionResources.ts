import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type CompResource = Database['public']['Tables']['cp_comp_resources']['Row'];
type CompResourceInsert = Database['public']['Tables']['cp_comp_resources']['Insert'];
type CompResourceUpdate = Database['public']['Tables']['cp_comp_resources']['Update'];

export const useCompetitionResources = (competitionId?: string) => {
  const { userProfile } = useAuth();
  const [resources, setResources] = useState<CompResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResources = async () => {
    if (!competitionId || !userProfile?.school_id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cp_comp_resources')
        .select('*')
        .eq('competition_id', competitionId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching competition resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setIsLoading(false);
    }
  };

  const createResource = async (resourceData: CompResourceInsert) => {
    if (!userProfile?.school_id) return;

    try {
      const { data, error } = await supabase
        .from('cp_comp_resources')
        .insert({
          ...resourceData,
          school_id: userProfile.school_id,
          created_by: userProfile.id
        })
        .select()
        .single();

      if (error) throw error;

      setResources(prev => [...prev, data].sort((a, b) => 
        new Date(a.start_time || '').getTime() - new Date(b.start_time || '').getTime()
      ));
      toast.success('Resource added successfully');
      return data;
    } catch (error) {
      console.error('Error creating resource:', error);
      toast.error('Failed to add resource');
      throw error;
    }
  };

  const updateResource = async (id: string, updates: CompResourceUpdate) => {
    try {
      const { data, error } = await supabase
        .from('cp_comp_resources')
        .update({
          ...updates,
          updated_by: userProfile?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setResources(prev => 
        prev.map(resource => resource.id === id ? data : resource)
          .sort((a, b) => 
            new Date(a.start_time || '').getTime() - new Date(b.start_time || '').getTime()
          )
      );
      toast.success('Resource updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource');
      throw error;
    }
  };

  const deleteResource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cp_comp_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setResources(prev => prev.filter(resource => resource.id !== id));
      toast.success('Resource removed successfully');
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to remove resource');
      throw error;
    }
  };

  useEffect(() => {
    fetchResources();
  }, [competitionId, userProfile?.school_id]);

  return {
    resources,
    isLoading,
    createResource,
    updateResource,
    deleteResource,
    refetch: fetchResources
  };
};