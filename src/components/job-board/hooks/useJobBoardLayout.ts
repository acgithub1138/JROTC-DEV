import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Node } from '@xyflow/react';
import { useCallback, useMemo } from 'react';

interface LayoutPreference {
  id: string;
  job_id: string;
  school_id: string;
  position_x: number;
  position_y: number;
}

interface SavedPosition {
  x: number;
  y: number;
}

export const useJobBoardLayout = (canAssign?: boolean) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Fetch saved layout preferences (school-wide)
  const { data: layoutPreferences = [], isLoading } = useQuery({
    queryKey: ['job-board-layout', userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];
      
      const { data, error } = await supabase
        .from('job_board_layout_preferences')
        .select('*')
        .eq('school_id', userProfile.school_id);

      if (error) {
        console.error('Error fetching layout preferences:', error);
        throw error;
      }
      return data as LayoutPreference[];
    },
    enabled: !!userProfile?.school_id,
  });

  // Save position mutation with better error handling and immediate cache update
  const savePositionMutation = useMutation({
    mutationFn: async ({ jobId, position }: { jobId: string; position: { x: number; y: number } }) => {
      if (!canAssign) {
        throw new Error('Permission denied: Cannot modify layout');
      }
      
      if (!userProfile?.school_id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('job_board_layout_preferences')
        .upsert({
          school_id: userProfile.school_id,
          job_id: jobId,
          position_x: position.x,
          position_y: position.y,
        }, {
          onConflict: 'school_id,job_id'
        });

      if (error) throw error;
      return position; // Return the position to indicate success
    },
    onSuccess: (position) => {
      // Optimistically update the cache instead of invalidating
      queryClient.setQueryData(['job-board-layout', userProfile?.school_id], (oldData: LayoutPreference[] = []) => {
        const existingIndex = oldData.findIndex(pref => 
          pref.job_id === savePositionMutation.variables?.jobId
        );
        
        if (existingIndex >= 0) {
          // Update existing preference
          const updated = [...oldData];
          updated[existingIndex] = {
            ...updated[existingIndex],
            position_x: position?.x || 0,
            position_y: position?.y || 0,
          };
          return updated;
        } else {
          // Add new preference
          return [...oldData, {
            id: `temp-${Date.now()}`,
            job_id: savePositionMutation.variables?.jobId || '',
            school_id: userProfile?.school_id || '',
            position_x: position?.x || 0,
            position_y: position?.y || 0,
          }];
        }
      });
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
      if (!canAssign) {
        throw new Error('Permission denied: Cannot modify layout');
      }
      
      if (!userProfile?.school_id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('job_board_layout_preferences')
        .delete()
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

  // Debounced save position function with immediate visual feedback
  const savePosition = useCallback((jobId: string, position: { x: number; y: number }) => {
    if (!canAssign) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to modify the layout",
        variant: "destructive",
      });
      return;
    }
    
    // Optimistically update local state immediately for smooth UX
    queryClient.setQueryData(['job-board-layout', userProfile?.school_id], (oldData: LayoutPreference[] = []) => {
      const existingIndex = oldData.findIndex(pref => pref.job_id === jobId);
      if (existingIndex >= 0) {
        const updated = [...oldData];
        updated[existingIndex] = { ...updated[existingIndex], position_x: position.x, position_y: position.y };
        return updated;
      } else {
        return [...oldData, {
          id: `temp-${jobId}-${Date.now()}`,
          job_id: jobId,
          school_id: userProfile?.school_id || '',
          position_x: position.x,
          position_y: position.y,
        } as LayoutPreference];
      }
    });
    
    // Then persist to database
    savePositionMutation.mutate({ jobId, position });
  }, [savePositionMutation, queryClient, userProfile?.school_id, canAssign, toast]);

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