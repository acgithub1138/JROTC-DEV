import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface JudgeAssignmentRecord {
  user_id: string;
  judge_id: string;
  assignment_id: string;
  competition_id: string;
  competition_name: string;
  competition_start_date: string;
  competition_end_date: string;
  competition_status: string;
  competition_location: string;
  event_id: string | null;
  event_name: string | null;
  event_start_time: string | null;
  event_end_time: string | null;
  event_location: string | null;
  assignment_details: string | null;
}

export const useAllJudgeAssignments = () => {
  const { data: assignments = [], isLoading, error } = useQuery({
    queryKey: ["all-judge-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cp_judge_assignment_view")
        .select("*")
        .order("competition_start_date", { ascending: true })
        .order("event_start_time", { ascending: true })
        .returns<JudgeAssignmentRecord[]>();

      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  return { assignments, isLoading, error };
};
