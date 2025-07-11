import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { IncidentComment } from "./types";

export const useIncidentComments = (incidentId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["incident-comments", incidentId],
    queryFn: async (): Promise<IncidentComment[]> => {
      const { data, error } = await supabase
        .from("incident_comments")
        .select(`
          *,
          user:profiles(first_name, last_name, email, role)
        `)
        .eq("incident_id", incidentId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching incident comments:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!incidentId,
  });

  const addComment = useMutation({
    mutationFn: async ({ comment_text, is_system_comment = false }: { 
      comment_text: string; 
      is_system_comment?: boolean; 
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("incident_comments")
        .insert({
          incident_id: incidentId,
          user_id: userData.user.id,
          comment_text,
          is_system_comment,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-comments", incidentId] });
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const updateComment = useMutation({
    mutationFn: async ({ commentId, comment_text }: { commentId: string; comment_text: string }) => {
      const { data, error } = await supabase
        .from("incident_comments")
        .update({ comment_text })
        .eq("id", commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-comments", incidentId] });
    },
    onError: (error) => {
      console.error("Error updating comment:", error);
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("incident_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-comments", incidentId] });
    },
    onError: (error) => {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  const addSystemComment = useMutation({
    mutationFn: async (comment_text: string) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("incident_comments")
        .insert({
          incident_id: incidentId,
          user_id: userData.user.id,
          comment_text,
          is_system_comment: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-comments", incidentId] });
    },
    onError: (error) => {
      console.error("Error adding system comment:", error);
    },
  });

  return {
    comments: query.data || [],
    isLoading: query.isLoading,
    addComment,
    addSystemComment,
    updateComment,
    deleteComment,
  };
};