import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Incident } from "./types";

export const useIncidentsQuery = () => {
  return useQuery({
    queryKey: ["incidents"],
    queryFn: async (): Promise<Incident[]> => {
      const { data, error } = await supabase
        .from("incidents")
        .select(`
          *,
          created_by_profile:profiles!incidents_created_by_fkey(first_name, last_name, email),
          assigned_to_admin_profile:profiles!incidents_assigned_to_admin_fkey(first_name, last_name, email),
          school:schools(name)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching incidents:", error);
        throw error;
      }

      return data || [];
    },
  });
};

export const useMyIncidentsQuery = () => {
  return useQuery({
    queryKey: ["my-incidents"],
    queryFn: async (): Promise<Incident[]> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("incidents")
        .select(`
          *,
          created_by_profile:profiles!incidents_created_by_fkey(first_name, last_name, email),
          assigned_to_admin_profile:profiles!incidents_assigned_to_admin_fkey(first_name, last_name, email),
          school:schools(name)
        `)
        .eq("assigned_to_admin", userData.user.id)
        .is("completed_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching my incidents:", error);
        throw error;
      }

      return data || [];
    },
  });
};

export const useActiveIncidentsQuery = () => {
  return useQuery({
    queryKey: ["active-incidents"],
    queryFn: async (): Promise<Incident[]> => {
      const { data, error } = await supabase
        .from("incidents")
        .select(`
          *,
          created_by_profile:profiles!incidents_created_by_fkey(first_name, last_name, email),
          assigned_to_admin_profile:profiles!incidents_assigned_to_admin_fkey(first_name, last_name, email),
          school:schools(name)
        `)
        .in("status", ["open", "in_progress"])
        .is("completed_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching active incidents:", error);
        throw error;
      }

      return data || [];
    },
  });
};

export const useCompletedIncidentsQuery = () => {
  return useQuery({
    queryKey: ["completed-incidents"],
    queryFn: async (): Promise<Incident[]> => {
      const { data, error } = await supabase
        .from("incidents")
        .select(`
          *,
          created_by_profile:profiles!incidents_created_by_fkey(first_name, last_name, email),
          assigned_to_admin_profile:profiles!incidents_assigned_to_admin_fkey(first_name, last_name, email),
          school:schools(name)
        `)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      if (error) {
        console.error("Error fetching completed incidents:", error);
        throw error;
      }

      return data || [];
    },
  });
};

export const useIncidentStatusOptions = () => {
  return useQuery({
    queryKey: ["incident-status-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incident_status_options")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) {
        console.error("Error fetching incident status options:", error);
        throw error;
      }

      return data || [];
    },
  });
};

export const useIncidentPriorityOptions = () => {
  return useQuery({
    queryKey: ["incident-priority-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incident_priority_options")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) {
        console.error("Error fetching incident priority options:", error);
        throw error;
      }

      return data || [];
    },
  });
};

export const useIncidentCategoryOptions = () => {
  return useQuery({
    queryKey: ["incident-category-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incident_category_options")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) {
        console.error("Error fetching incident category options:", error);
        throw error;
      }

      return data || [];
    },
  });
};