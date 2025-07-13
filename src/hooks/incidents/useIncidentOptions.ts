import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface IncidentOption {
  id: string;
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface OptionFormData {
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
  is_active: boolean;
}

// Status Options Hook
export const useIncidentStatusOptions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: statusOptions = [], isLoading } = useQuery({
    queryKey: ["incident-status-options-management"],
    queryFn: async (): Promise<IncidentOption[]> => {
      const { data, error } = await supabase
        .from("incident_status_options")
        .select("*")
        .order("sort_order");

      if (error) {
        console.error("Error fetching incident status options:", error);
        throw error;
      }

      return data || [];
    },
  });

  const createStatusOption = useMutation({
    mutationFn: async (formData: OptionFormData) => {
      const { data, error } = await supabase
        .from("incident_status_options")
        .insert([formData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-status-options-management"] });
      queryClient.invalidateQueries({ queryKey: ["incident-status-options"] });
      toast({
        title: "Success",
        description: "Status option created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create status option",
        variant: "destructive",
      });
      console.error("Error creating status option:", error);
    },
  });

  const updateStatusOption = useMutation({
    mutationFn: async (option: OptionFormData & { id: string }) => {
      const { id, ...updateData } = option;
      const { data, error } = await supabase
        .from("incident_status_options")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-status-options-management"] });
      queryClient.invalidateQueries({ queryKey: ["incident-status-options"] });
      toast({
        title: "Success",
        description: "Status option updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update status option",
        variant: "destructive",
      });
      console.error("Error updating status option:", error);
    },
  });

  const deleteStatusOption = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("incident_status_options")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-status-options-management"] });
      queryClient.invalidateQueries({ queryKey: ["incident-status-options"] });
      toast({
        title: "Success",
        description: "Status option deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete status option",
        variant: "destructive",
      });
      console.error("Error deleting status option:", error);
    },
  });

  return {
    statusOptions,
    isLoading,
    createStatusOption: createStatusOption.mutate,
    updateStatusOption: updateStatusOption.mutate,
    deleteStatusOption: deleteStatusOption.mutate,
  };
};

// Priority Options Hook
export const useIncidentPriorityOptions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: priorityOptions = [], isLoading } = useQuery({
    queryKey: ["incident-priority-options-management"],
    queryFn: async (): Promise<IncidentOption[]> => {
      const { data, error } = await supabase
        .from("incident_priority_options")
        .select("*")
        .order("sort_order");

      if (error) {
        console.error("Error fetching incident priority options:", error);
        throw error;
      }

      return data || [];
    },
  });

  const createPriorityOption = useMutation({
    mutationFn: async (formData: OptionFormData) => {
      const { data, error } = await supabase
        .from("incident_priority_options")
        .insert([formData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-priority-options-management"] });
      queryClient.invalidateQueries({ queryKey: ["incident-priority-options"] });
      toast({
        title: "Success",
        description: "Priority option created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create priority option",
        variant: "destructive",
      });
      console.error("Error creating priority option:", error);
    },
  });

  const updatePriorityOption = useMutation({
    mutationFn: async (option: OptionFormData & { id: string }) => {
      const { id, ...updateData } = option;
      const { data, error } = await supabase
        .from("incident_priority_options")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-priority-options-management"] });
      queryClient.invalidateQueries({ queryKey: ["incident-priority-options"] });
      toast({
        title: "Success",
        description: "Priority option updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update priority option",
        variant: "destructive",
      });
      console.error("Error updating priority option:", error);
    },
  });

  const deletePriorityOption = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("incident_priority_options")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-priority-options-management"] });
      queryClient.invalidateQueries({ queryKey: ["incident-priority-options"] });
      toast({
        title: "Success",
        description: "Priority option deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete priority option",
        variant: "destructive",
      });
      console.error("Error deleting priority option:", error);
    },
  });

  return {
    priorityOptions,
    isLoading,
    createPriorityOption: createPriorityOption.mutate,
    updatePriorityOption: updatePriorityOption.mutate,
    deletePriorityOption: deletePriorityOption.mutate,
  };
};

// Category Options Hook
export const useIncidentCategoryOptions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categoryOptions = [], isLoading } = useQuery({
    queryKey: ["incident-category-options-management"],
    queryFn: async (): Promise<IncidentOption[]> => {
      const { data, error } = await supabase
        .from("incident_category_options")
        .select("*")
        .order("sort_order");

      if (error) {
        console.error("Error fetching incident category options:", error);
        throw error;
      }

      return data || [];
    },
  });

  const createCategoryOption = useMutation({
    mutationFn: async (formData: OptionFormData) => {
      const { data, error } = await supabase
        .from("incident_category_options")
        .insert([formData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-category-options-management"] });
      queryClient.invalidateQueries({ queryKey: ["incident-category-options"] });
      toast({
        title: "Success",
        description: "Category option created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create category option",
        variant: "destructive",
      });
      console.error("Error creating category option:", error);
    },
  });

  const updateCategoryOption = useMutation({
    mutationFn: async (option: OptionFormData & { id: string }) => {
      const { id, ...updateData } = option;
      const { data, error } = await supabase
        .from("incident_category_options")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-category-options-management"] });
      queryClient.invalidateQueries({ queryKey: ["incident-category-options"] });
      toast({
        title: "Success",
        description: "Category option updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update category option",
        variant: "destructive",
      });
      console.error("Error updating category option:", error);
    },
  });

  const deleteCategoryOption = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("incident_category_options")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incident-category-options-management"] });
      queryClient.invalidateQueries({ queryKey: ["incident-category-options"] });
      toast({
        title: "Success",
        description: "Category option deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete category option",
        variant: "destructive",
      });
      console.error("Error deleting category option:", error);
    },
  });

  return {
    categoryOptions,
    isLoading,
    createCategoryOption: createCategoryOption.mutate,
    updateCategoryOption: updateCategoryOption.mutate,
    deleteCategoryOption: deleteCategoryOption.mutate,
  };
};