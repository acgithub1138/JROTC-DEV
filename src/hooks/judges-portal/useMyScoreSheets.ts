import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export interface JudgeScoreSheet {
  id: string;
  competition_id: string;
  source_competition_id: string;
  event: string;
  school_id: string;
  team_name: string | null;
  cadet_ids: string[] | null;
  score_sheet: any;
  total_points: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  competition_name: string;
  competition_start_date: string;
  competition_location: string;
  competition_status: string;
  event_name: string;
  event_description: string | null;
  school_name: string | null;
}

export const useMyScoreSheets = () => {
  const [userId, setUserId] = useState<string | null>(null);

  // Resolve user once before querying
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setUserId(user?.id ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const {
    data: scoreSheets = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["judge-score-sheets", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("judge_score_sheets_view" as any)
        .select("*")
        .eq("created_by", userId as string)
        .order("competition_start_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as JudgeScoreSheet[];
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  return {
    scoreSheets,
    isLoading,
    error,
  };
};
