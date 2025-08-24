import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Announcement {
  id: string;
  school_id: string;
  title: string;
  content: string;
  author_id: string;
  priority: number;
  is_active: boolean;
  publish_date: string;
  expire_date?: string;
  created_at: string;
  updated_at: string;
  author?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  priority: number;
  is_active: boolean;
  publish_date: string;
  expire_date?: string;
}

export interface UpdateAnnouncementData extends Partial<CreateAnnouncementData> {
  id: string;
}

export const useAnnouncements = () => {
  const { userProfile } = useAuth();
  
  return useQuery({
    queryKey: ['announcements', userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];
      
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          author:profiles!announcements_author_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('school_id', userProfile.school_id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Announcement[];
    },
    enabled: !!userProfile?.school_id,
  });
};

export const useActiveAnnouncements = () => {
  const { userProfile } = useAuth();
  
  return useQuery({
    queryKey: ['active-announcements', userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];
      
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          author:profiles!announcements_author_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('school_id', userProfile.school_id)
        .eq('is_active', true)
        .lte('publish_date', now)
        .or(`expire_date.is.null,expire_date.gte.${now}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data as Announcement[];
    },
    enabled: !!userProfile?.school_id,
  });
};

export const useCreateAnnouncement = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateAnnouncementData) => {
      if (!userProfile?.school_id) throw new Error('School ID not found');
      
      const { data: announcement, error } = await supabase
        .from('announcements')
        .insert({
          ...data,
          school_id: userProfile.school_id,
          author_id: userProfile.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return announcement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active-announcements'] });
      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
      console.error('Create announcement error:', error);
    },
  });
};

export const useUpdateAnnouncement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateAnnouncementData) => {
      const { id, ...updateData } = data;
      const { data: announcement, error } = await supabase
        .from('announcements')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return announcement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active-announcements'] });
      toast({
        title: "Success",
        description: "Announcement updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      });
      console.error('Update announcement error:', error);
    },
  });
};

export const useDeleteAnnouncement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // First, get all attachments for this announcement
      const { data: attachments, error: attachmentsFetchError } = await supabase
        .from('attachments')
        .select('id, file_path')
        .eq('record_type', 'announcement')
        .eq('record_id', id);

      if (attachmentsFetchError) throw attachmentsFetchError;

      // Delete attachments if they exist
      if (attachments && attachments.length > 0) {
        // Delete files from storage
        const filePaths = attachments.map(att => att.file_path);
        const { error: storageError } = await supabase.storage
          .from('task-incident-attachments')
          .remove(filePaths);

        if (storageError) throw storageError;

        // Delete attachment records from database
        const { error: attachmentDeleteError } = await supabase
          .from('attachments')
          .delete()
          .eq('record_type', 'announcement')
          .eq('record_id', id);

        if (attachmentDeleteError) throw attachmentDeleteError;
      }

      // Finally, delete the announcement
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['active-announcements'] });
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
      console.error('Delete announcement error:', error);
    },
  });
};