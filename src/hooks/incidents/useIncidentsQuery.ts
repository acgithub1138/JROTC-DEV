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

      // Get user profile to check their role
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      let query = supabase
        .from("incidents")
        .select(`
          *,
          created_by_profile:profiles!incidents_created_by_fkey(first_name, last_name, email),
          assigned_to_admin_profile:profiles!incidents_assigned_to_admin_fkey(first_name, last_name, email),
          school:schools(name)
        `)
        .is("completed_at", null);

      // If user is instructor, command_staff, or admin, show all incidents for their school
      // Otherwise, show only incidents they created or are assigned to
      if (userProfile?.role && ['instructor', 'command_staff', 'admin'].includes(userProfile.role)) {
        // Show all incidents for the school (will be filtered by RLS)
        query = query.order("created_at", { ascending: false });
      } else {
        // For cadets and other roles, show only their own incidents
        query = query
          .or(`assigned_to_admin.eq.${userData.user.id},created_by.eq.${userData.user.id}`)
          .order("created_at", { ascending: false });
      }

      const { data, error } = await query;

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