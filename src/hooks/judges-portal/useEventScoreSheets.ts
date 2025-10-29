import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const useEventScoreSheets = (
  eventId: string | undefined,
  competitionId: string | undefined,
  userId: string | undefined
) => {
  return useQuery({
    queryKey: ["event-score-sheets", eventId, competitionId, userId],
    enabled: !!eventId && !!competitionId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_events")
        .select("school_id, score_sheet")
        .eq("event", eventId as string)
        .eq("source_competition_id", competitionId as string)
        .eq("created_by", userId as string);

      if (error) throw error;
      
      // Return Set of school IDs that already have submissions
      return new Set(data?.map(record => record.school_id) || []);
    },
    staleTime: 0,
    refetchOnMount: true,
  });
};
