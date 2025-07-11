import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CreateIncidentData, UpdateIncidentData } from "./types";

export const useIncidentMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createIncident = useMutation({
    mutationFn: async (data: CreateIncidentData) => {
      // Get admin user ID
      const { data: adminUser, error: adminError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", "admin@careyunlimited.com")
        .single();

      if (adminError) {
        console.error("Error finding admin user:", adminError);
      }

      // Auto-assign to admin if found
      const incidentData = {
        ...data,
        assigned_to_admin: adminUser?.id || data.assigned_to_admin,
      };

      const { data: result, error } = await supabase
        .from("incidents")
        .insert(incidentData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast({
        title: "Success",
        description: "Incident created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating incident:", error);
      toast({
        title: "Error",
        description: "Failed to create incident",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
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