import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { supabase } from '@/integrations/supabase/client';

interface OfflineTaskManager {
  createTaskOffline: (taskData: any) => Promise<string>;
  updateTaskOffline: (taskId: string, updates: any) => Promise<string>;
  deleteTaskOffline: (taskId: string) => Promise<string>;
  queuedActions: number;
}

export const useOfflineTaskManager = (): OfflineTaskManager => {
  const { saveToOfflineQueue, offlineQueue } = useOfflineSync();
  const { toast } = useToast();

  const createTaskOffline = useCallback(async (taskData: any) => {
    try {
      // Try online first
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (!error) {
        toast({
          title: "Task Created",
          description: "Task created successfully",
        });
        return data.id;
      }
      
      throw new Error(error.message);
    } catch (error) {
      // Queue for offline sync
      const queueId = await saveToOfflineQueue({
        method: 'POST',
        url: '/api/tasks',
        data: taskData
      });

      toast({
        title: "Task Queued",
        description: "Task will be created when connection is restored",
      });

      return queueId;
    }
  }, [saveToOfflineQueue, toast]);

  const updateTaskOffline = useCallback(async (taskId: string, updates: any) => {
    try {
      // Try online first
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (!error) {
        toast({
          title: "Task Updated",
          description: "Task updated successfully",
        });
        return taskId;
      }
      
      throw new Error(error.message);
    } catch (error) {
      // Queue for offline sync
      const queueId = await saveToOfflineQueue({
        method: 'PUT',
        url: `/api/tasks/${taskId}`,
        data: updates
      });

      toast({
        title: "Update Queued",
        description: "Task update will sync when connection is restored",
      });

      return queueId;
    }
  }, [saveToOfflineQueue, toast]);

  const deleteTaskOffline = useCallback(async (taskId: string) => {
    try {
      // Try online first
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (!error) {
        toast({
          title: "Task Deleted",
          description: "Task deleted successfully",
        });
        return taskId;
      }
      
      throw new Error(error.message);
    } catch (error) {
      // Queue for offline sync
      const queueId = await saveToOfflineQueue({
        method: 'DELETE',
        url: `/api/tasks/${taskId}`,
        data: { taskId }
      });

      toast({
        title: "Deletion Queued",
        description: "Task deletion will sync when connection is restored",
      });

      return queueId;
    }
  }, [saveToOfflineQueue, toast]);

  return {
    createTaskOffline,
    updateTaskOffline,
    deleteTaskOffline,
    queuedActions: offlineQueue.length
  };
};