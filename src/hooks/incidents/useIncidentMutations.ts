import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CreateIncidentData, Incident } from './types';

export const useIncidentMutations = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createIncident = useMutation({
    mutationFn: async (incidentData: CreateIncidentData) => {
      if (!userProfile?.school_id || !userProfile?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('incidents')
        .insert({
          ...incidentData,
          school_id: userProfile.school_id,
          submitted_by: userProfile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast({
        title: "Incident created",
        description: "Your incident has been submitted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create incident. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating incident:', error);
    },
  });

  const updateIncident = useMutation({
    mutationFn: async (incidentData: Partial<Incident> & { id: string }) => {
      const { data, error } = await supabase
        .from('incidents')
        .update(incidentData)
        .eq('id', incidentData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast({
        title: "Incident updated",
        description: "The incident has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update incident. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating incident:', error);
    },
  });

  const deleteIncident = useMutation({
    mutationFn: async (incidentId: string) => {
      const { error } = await supabase
        .from('incidents')
        .delete()
        .eq('id', incidentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast({
        title: "Incident deleted",
        description: "The incident has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete incident. Please try again.",
        variant: "destructive",
      });
      console.error('Error deleting incident:', error);
    },
  });

  return {
    createIncident: createIncident.mutate,
    updateIncident: updateIncident.mutate,
    deleteIncident: deleteIncident.mutate,
    isCreating: createIncident.isPending,
    isUpdating: updateIncident.isPending,
    isDeleting: deleteIncident.isPending,
  };
};