import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Node } from '@xyflow/react';
import { useCallback, useMemo } from 'react';

interface LayoutPreference {
  id: string;
  job_id: string;
  position_x: number;
  position_y: number;
}

interface SavedPosition {
  x: number;
  y: number;
}

export const useJobBoardLayout = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch saved layout preferences
  const { data: layoutPreferences = [], isLoading } = useQuery({
    queryKey: ['job-board-layout', userProfile?.id, userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.id || !userProfile?.school_id) return [];
      
      const { data, error } = await supabase
        .from('job_board_layout_preferences')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('school_id', userProfile.school_id);

      if (error) {
        console.error('Error fetching layout preferences:', error);
        throw error;
      }
      return data as LayoutPreference[];
    },
    enabled: !!userProfile?.id && !!userProfile?.school_id,
  });

  // Save position mutation
  const savePositionMutation = useMutation({
    mutationFn: async ({ jobId, position }: { jobId: string; position: { x: number; y: number } }) => {
      if (!userProfile?.id || !userProfile?.school_id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('job_board_layout_preferences')
        .upsert({
          user_id: userProfile.id,
          school_id: userProfile.school_id,
          job_id: jobId,
          position_x: position.x,
          position_y: position.y,
        }, {
          onConflict: 'user_id,job_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-board-layout'] });
    },
    onError: (error) => {
      console.error('Error saving position:', error);
      toast({
        title: "Error",
        description: "Failed to save layout position",
        variant: "destructive",
      });
    },
  });

  // Clear all layout preferences
  const clearLayoutMutation = useMutation({
    mutationFn: async () => {
      if (!userProfile?.id || !userProfile?.school_id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('job_board_layout_preferences')
        .delete()
        .eq('user_id', userProfile.id)
        .eq('school_id', userProfile.school_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-board-layout'] });
      toast({
        title: "Success",
        description: "Layout reset to default",
      });
    },
    onError: (error) => {
      console.error('Error clearing layout:', error);
      toast({
        title: "Error",
        description: "Failed to reset layout",
        variant: "destructive",
      });
    },
  });

  // Get saved positions as a map - memoized to prevent unnecessary recalculations
  const getSavedPositions = useCallback((): Map<string, SavedPosition> => {
    const positionsMap = new Map<string, SavedPosition>();
    layoutPreferences.forEach(pref => {
      positionsMap.set(pref.job_id, {
        x: Number(pref.position_x),
        y: Number(pref.position_y)
      });
    });
    return positionsMap;
  }, [layoutPreferences]);

  // Memoize the saved positions map to stabilize references
  const savedPositionsMap = useMemo(() => getSavedPositions(), [getSavedPositions]);

  // Debounced save position function
  const savePosition = useCallback((jobId: string, position: { x: number; y: number }) => {
    savePositionMutation.mutate({ jobId, position });
  }, [savePositionMutation]);

  // Reset layout to default
  const resetLayout = useCallback(() => {
    clearLayoutMutation.mutate();
  }, [clearLayoutMutation]);

  // Handle node changes and save positions
  const handleNodesChange = useCallback((changes: any[], nodes: Node[]) => {
    // Filter for position changes only
    const positionChanges = changes.filter(change => 
      change.type === 'position' && change.dragging === false && change.position
    );

    // Save positions when dragging ends
    positionChanges.forEach(change => {
      const node = nodes.find(n => n.id === change.id);
      if (node && change.position) {
        savePosition(change.id, change.position);
      }
    });
  }, [savePosition]);

  return {
    layoutPreferences,
    isLoading,
    getSavedPositions,
    savedPositionsMap,
    savePosition,
    resetLayout,
    handleNodesChange,
    isResetting: clearLayoutMutation.isPending,
  };
};