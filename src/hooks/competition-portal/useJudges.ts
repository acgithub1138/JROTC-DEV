import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Judge {
  id: string;
  school_id: string;
  name: string;
  phone?: string;
  email?: string;
  available: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useJudges = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  const { data: judges = [], isLoading } = useQuery({
    queryKey: ['cp-judges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cp_judges')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Judge[];
    },
  });

  const createJudge = useMutation({
    mutationFn: async (judgeData: Omit<Judge, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'school_id'>) => {
      const { data, error } = await supabase
        .from('cp_judges')
        .insert({
          ...judgeData,
          created_by: userProfile?.id,
          school_id: userProfile?.school_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cp-judges'] });
      toast({
        title: "Judge created",
        description: "Judge has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create judge.",
        variant: "destructive",
      });
    },
  });

  const updateJudge = useMutation({
    mutationFn: async ({ id, ...judgeData }: Partial<Judge> & { id: string }) => {
      const { data, error } = await supabase
        .from('cp_judges')
        .update(judgeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cp-judges'] });
      toast({
        title: "Judge updated",
        description: "Judge has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update judge.",
        variant: "destructive",
      });
    },
  });

  const deleteJudge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cp_judges')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cp-judges'] });
      toast({
        title: "Judge deleted",
        description: "Judge has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete judge.",
        variant: "destructive",
      });
    },
  });

  const bulkImportJudges = async (
    judges: any[], // Accept any array to handle ParsedJudge objects
    onProgress?: (current: number, total: number) => void
  ): Promise<{ success: number; failed: number; errors: string[] }> => {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    for (let i = 0; i < judges.length; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to prevent overwhelming the API
        
        // Filter out UI-only fields that don't exist in the database
        const { id, errors, isValid, ...judgeData } = judges[i];
        const { error } = await supabase
          .from('cp_judges')
          .insert({
            ...judgeData,
            created_by: userProfile?.id,
            school_id: userProfile?.school_id,
          });

        if (error) {
          results.failed++;
          results.errors.push(`Failed to create judge "${judges[i].name}": ${error.message}`);
        } else {
          results.success++;
        }
        
        onProgress?.(i + 1, judges.length);
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to create judge "${judges[i].name}": ${error.message}`);
        onProgress?.(i + 1, judges.length);
      }
    }
    
    // Invalidate queries to refresh the list
    queryClient.invalidateQueries({ queryKey: ['cp-judges'] });
    
    // Show toast notification
    if (results.success > 0) {
      toast({
        title: "Bulk import completed",
        description: `Successfully imported ${results.success} judge(s).${results.failed > 0 ? ` ${results.failed} failed.` : ''}`,
      });
    } else {
      toast({
        title: "Import failed",
        description: "No judges were imported successfully.",
        variant: "destructive",
      });
    }
    
    return results;
  };

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ judgeIds, available }: { judgeIds: string[]; available: boolean }) => {
      const promises = judgeIds.map(id => 
        supabase
          .from('cp_judges')
          .update({ available })
          .eq('id', id)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} judge(s)`);
      }
      
      return results;
    },
    onSuccess: (_, { judgeIds, available }) => {
      queryClient.invalidateQueries({ queryKey: ['cp-judges'] });
      toast({
        title: "Judges updated",
        description: `${judgeIds.length} judge(s) marked as ${available ? 'available' : 'unavailable'}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update judges.",
        variant: "destructive",
      });
    },
  });

  return {
    judges,
    isLoading,
    createJudge: createJudge.mutate,
    updateJudge: updateJudge.mutate,
    deleteJudge: deleteJudge.mutate,
    bulkImportJudges,
    bulkUpdateStatus: bulkUpdateStatus.mutate,
    isCreating: createJudge.isPending,
    isUpdating: updateJudge.isPending,
    isDeleting: deleteJudge.isPending,
    isBulkUpdating: bulkUpdateStatus.isPending,
  };
};