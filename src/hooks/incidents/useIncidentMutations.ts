import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CreateIncidentData, UpdateIncidentData } from "./types";

export const useIncidentMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createIncident = useMutation({
    mutationFn: async (data: CreateIncidentData) => {
      const { data: result, error } = await supabase
        .from("incidents")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data, variables, context) => {
      // Invalidate all incident-related queries
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["my-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["active-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["completed-incidents"] });
      
      // Also invalidate with a broader pattern to catch any missed queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0] === 'incidents' || 
                 query.queryKey[0] === 'my-incidents' || 
                 query.queryKey[0] === 'active-incidents' || 
                 query.queryKey[0] === 'completed-incidents';
        }
      });
      
      toast({
        title: "Success",
        description: "Incident created successfully",
      });
    },
    onError: (error) => {
      console.error("🔴 INCIDENT CREATION ERROR:", error);
      console.error("🔴 ERROR DETAILS:", {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
        stack: error.stack
      });
      toast({
        title: "Error",
        description: `Failed to create incident: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateIncident = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateIncidentData }) => {
      const { data: result, error } = await supabase
        .from("incidents")
        .update(data)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!result) {
        throw new Error("Incident not found or you don't have permission to update it");
      }
      return result;
    },
    onSuccess: (data, variables, context) => {
      // Invalidate all incident-related queries
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["my-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["active-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["completed-incidents"] });
      toast({
        title: "Success",
        description: "Incident updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating incident:", error);
      toast({
        title: "Error",
        description: "Failed to update incident",
        variant: "destructive",
      });
    },
  });

  const deleteIncident = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("incidents")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast({
        title: "Success",
        description: "Incident deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting incident:", error);
      toast({
        title: "Error",
        description: "Failed to delete incident",
        variant: "destructive",
      });
    },
  });

  return {
    createIncident,
    updateIncident,
    deleteIncident,
  };
};