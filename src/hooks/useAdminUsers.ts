import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<AdminUser[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("role", "admin")
        .eq("active", true)
        .order("last_name", { ascending: true });

      if (error) {
        console.error("Error fetching admin users:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - admin users change infrequently
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
};