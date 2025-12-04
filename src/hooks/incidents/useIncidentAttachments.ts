import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useIncidentComments } from './useIncidentComments';
import type { Attachment, CreateAttachmentData } from '../attachments/types';

export const useIncidentAttachments = (incidentId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addSystemComment } = useIncidentComments(incidentId);

  const attachmentsQuery = useQuery({
    queryKey: ['attachments', 'incident', incidentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('record_type', 'incident')
        .eq('record_id', incidentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Attachment[];
    },
    enabled: !!incidentId,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ record_type, record_id, file }: CreateAttachmentData) => {
      if (!user) throw new Error('User not authenticated');

      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('task-incident-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create attachment record
      // Get school_id from user metadata or profile
      let schoolId = user.user_metadata?.school_id;
      
      if (!schoolId) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw new Error('Could not retrieve user school information');
        schoolId = profileData?.school_id;
      }
      
      if (!schoolId) {
        throw new Error('User does not have a school assigned');
      }

      const { data, error } = await supabase
        .from('attachments')
        .insert({
          record_type,
          record_id,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id,
          school_id: schoolId,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add system comment for file upload
      await addSystemComment.mutateAsync(`File attached: "${file.name}"`);
      
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attachments', 'incident', incidentId] });
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      // Get attachment details first for the system comment
      const { data: attachment, error: fetchError } = await supabase
        .from('attachments')
        .select('file_path, file_name')
        .eq('id', attachmentId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('task-incident-attachments')
        .remove([attachment.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;
      
      // Add system comment for file deletion
      await addSystemComment.mutateAsync(`File removed: "${attachment.file_name}"`);
      
      return { fileName: attachment.file_name };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', 'incident', incidentId] });
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const getFileUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('task-incident-attachments')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (data?.signedUrl) {
      // If the URL is relative, prepend the Supabase URL
      if (data.signedUrl.startsWith('/')) {
        return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1${data.signedUrl}`;
      }
      return data.signedUrl;
    }
    
    return null;
  };

  return {
    attachments: attachmentsQuery.data || [],
    isLoading: attachmentsQuery.isLoading,
    error: attachmentsQuery.error,
    uploadFile: uploadMutation.mutateAsync,
    deleteFile: deleteMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    getFileUrl,
  };
};