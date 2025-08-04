import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface PTTestData {
  id: string;
  cadet_id: string;
  date: string;
  push_ups: number | null;
  sit_ups: number | null;
  plank_time: number | null;
  mile_time: number | null;
}

export interface PTTestUpdateData {
  push_ups: number | null;
  sit_ups: number | null;
  plank_time: number | null;
  mile_time: number | null;
}

export const usePTTestEdit = () => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PTTestUpdateData }) => {
      const { error } = await supabase
        .from('pt_tests')
        .update(data)
        .eq('id', id)
        .eq('school_id', userProfile?.school_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-tests'] });
      toast({
        title: "Success",
        description: "PT test updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error updating PT test:', error);
      toast({
        title: "Error",
        description: "Failed to update PT test",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pt_tests')
        .delete()
        .eq('id', id)
        .eq('school_id', userProfile?.school_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-tests'] });
      toast({
        title: "Success", 
        description: "PT test deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting PT test:', error);
      toast({
        title: "Error",
        description: "Failed to delete PT test",
        variant: "destructive",
      });
    },
  });

  const parseTimeToSeconds = (timeStr: string): number | null => {
    if (!timeStr.trim()) return null;
    
    // If it's already just seconds
    if (/^\d+$/.test(timeStr)) {
      return parseInt(timeStr);
    }
    
    // If it's MM:SS format
    const match = timeStr.match(/^(\d+):(\d+)$/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      return minutes * 60 + seconds;
    }
    
    // Default to treating as seconds
    const parsed = parseInt(timeStr);
    return isNaN(parsed) ? null : parsed;
  };

  const formatSecondsToTime = (seconds: number | null): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    updatePTTest: updateMutation.mutate,
    deletePTTest: deleteMutation.mutate,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    parseTimeToSeconds,
    formatSecondsToTime,
  };
};