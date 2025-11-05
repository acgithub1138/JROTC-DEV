import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, History } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCompetitionResultsPermissions } from "@/hooks/useModuleSpecificPermissions";
import { ScoreSheetHistoryModal } from "../components/ScoreSheetHistoryModal";
interface CompetitionResultsTabProps {
  competitionId: string;
}
interface CompetitionEventRow {
  id: string;
  event: string;
  total_points: number | null;
  score_sheet: any;
  school_id: string;
  created_at: string;
  has_history?: boolean;
}
interface CPSchoolRow {
  school_id: string;
  school_name: string | null;
}
const formatEventName = (name?: string) => {
  if (!name) return "Unknown Event";
  return name
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};
export const CompetitionResultsTab: React.FC<CompetitionResultsTabProps> = ({ competitionId }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { canView, canViewDetails, canUpdate } = useCompetitionResultsPermissions();
  const [rows, setRows] = useState<CompetitionEventRow[]>([]);
  const [schoolMap, setSchoolMap] = useState<Record<string, string>>({});
  const [eventMap, setEventMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    competitionEventId: string;
    schoolId: string;
    eventId: string;
    schoolName: string;
    eventName: string;
  }>({
    isOpen: false,
    competitionEventId: "",
    schoolId: "",
    eventId: "",
    schoolName: "",
    eventName: "",
  });
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    const [eventsRes, schoolsRes, eventTypesRes, historyRes] = await Promise.all([
      supabase
        .from("competition_events")
        .select("id, event, total_points, score_sheet, school_id, created_at")
        .eq("source_type", "portal")
        .eq("source_competition_id", competitionId),
      supabase.from("cp_comp_schools").select("school_id, school_name").eq("competition_id", competitionId),
      supabase.from("competition_event_types").select("id, name"),
      supabase.from("competition_events_history").select("competition_event_id"),
    ]);
    if (eventsRes.error || schoolsRes.error || eventTypesRes.error) {
      setError(
        eventsRes.error?.message ||
          schoolsRes.error?.message ||
          eventTypesRes.error?.message ||
          "Failed to load results",
      );
      setIsLoading(false);
      return;
    }

    // Create a set of competition event IDs that have history
    const eventIdsWithHistory = new Set((historyRes.data || []).map((h) => h.competition_event_id));

    // Add has_history property to events
    const eventsWithHistory = (eventsRes.data || []).map((event) => ({
      ...event,
      has_history: eventIdsWithHistory.has(event.id),
    }));
    setRows(eventsWithHistory as CompetitionEventRow[]);
    const schoolNameMap: Record<string, string> = {};
    (schoolsRes.data || []).forEach((s: CPSchoolRow) => {
      if (s.school_id) schoolNameMap[s.school_id] = s.school_name || "Unknown School";
    });
    setSchoolMap(schoolNameMap);
    const eventNameMap: Record<string, string> = {};
    (eventTypesRes.data || []).forEach((e: any) => {
      if (e.id) eventNameMap[e.id] = e.name || "Unknown Event";
    });
    setEventMap(eventNameMap);
    setIsLoading(false);
  };
  useEffect(() => {
    let active = true;
    const load = async () => {
      await fetchData();
    };
    load();
    return () => {
      active = false;
    };
  }, [competitionId]);
  const grouped = useMemo(() => {
    type JudgeScore = {
      judgeNumber?: number;
      score: number;
    };
    type SchoolAgg = {
      schoolId: string;
      schoolName: string;
      judges: JudgeScore[];
      total: number;
      eventRecords: CompetitionEventRow[]; // Store the original event records
    };
    const result = new Map<
      string,
      {
        event: string;
        eventId: string;
        schools: SchoolAgg[];
        judgeNumbers: number[];
      }
    >();
    const eventGroupMap: Record<
      string,
      {
        schoolsMap: Map<string, SchoolAgg>;
        judgeSet: Set<number>;
        eventKey: string;
        eventId: string;
      }
    > = {};
    function getJudgeNumber(ss: any): number | undefined {
      const candidates = [ss?.judge_number, ss?.judgeNumber, ss?.judgeNo, ss?.judge, ss?.judge_id];
      for (const c of candidates) {
        if (c !== null && c !== undefined) {
          const n = parseInt(String(c), 10);
          if (!isNaN(n)) return n;
        }
      }
      return undefined;
    }
    (rows || []).forEach((r) => {
      const eventId = r.event || "Unknown";
      const eventName = eventMap[eventId] || "Unknown Event";
      if (!eventGroupMap[eventName])
        eventGroupMap[eventName] = {
          schoolsMap: new Map(),
          judgeSet: new Set(),
          eventKey: eventName,
          eventId,
        };
      const { schoolsMap, judgeSet } = eventGroupMap[eventName];
      const schoolId = r.school_id;
      const schoolName = schoolMap[schoolId] || "Unknown School";
      const score = typeof r.total_points === "number" ? r.total_points : Number(r.total_points) || 0;
      const judgeNumber = getJudgeNumber(r.score_sheet);
      if (judgeNumber !== undefined) judgeSet.add(judgeNumber);
      let agg = schoolsMap.get(schoolId);
      if (!agg) {
        agg = {
          schoolId,
          schoolName,
          judges: [],
          total: 0,
          eventRecords: [],
        };
        schoolsMap.set(schoolId, agg);
      }
      agg.judges.push({
        judgeNumber,
        score,
      });
      agg.total += score;
      agg.eventRecords.push(r); // Store the event record
    });
    Object.keys(eventGroupMap).forEach((ev) => {
      const { schoolsMap, judgeSet, eventKey, eventId } = eventGroupMap[ev];
      const schools = Array.from(schoolsMap.values());

      // Sort judges per school by judge number
      schools.forEach((s) => {
        s.judges.sort((a, b) => {
          const an = a.judgeNumber ?? 9999;
          const bn = b.judgeNumber ?? 9999;
          return an - bn;
        });
      });

      // Sort schools by total score descending
      schools.sort((a, b) => b.total - a.total);
      const judgeNumbers = Array.from(judgeSet.values()).sort((a, b) => a - b);
      result.set(ev, {
        event: eventKey,
        eventId,
        schools,
        judgeNumbers,
      });
    });
    return result;
  }, [rows, schoolMap, eventMap]);
  const openHistoryModal = (schoolAgg: any, eventName: string, eventId: string) => {
    setHistoryModal({
      isOpen: true,
      competitionEventId: "",
      // Not needed anymore but keeping for compatibility
      schoolId: schoolAgg.schoolId,
      eventId: eventId,
      schoolName: schoolAgg.schoolName,
      eventName: eventName,
    });
  };
  const hasAnyHistory = (schoolAgg: any) => {
    return schoolAgg.eventRecords.some((record: CompetitionEventRow) => record.has_history);
  };
  if (!canView) {
    return <div className="p-4 text-sm text-muted-foreground">You don't have permission to view results.</div>;
  }
  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading results...</div>;
  if (error) return <div className="p-4 text-sm text-destructive">Error: {error}</div>;
  if (rows.length === 0) return <div className="p-4 text-sm text-muted-foreground">No results submitted yet.</div>;
  return (
    <div className="space-y-6">
      {Array.from(grouped.values()).map((group) => (
        <Card key={group.event}>
          <CardHeader className="py-[6px]">
            <CardTitle>{group.event} - Results</CardTitle>
          </CardHeader>

          <CardContent>
            {isMobile ? (
              <div className="space-y-4">
                {group.schools.map((s, idx) => (
                  <Card key={s.schoolId}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex justify-between items-center">
                        <span>
                          #{idx + 1} {s.schoolName}
                        </span>
                        <span className="text-lg font-bold">{s.total.toFixed(1)}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {group.judgeNumbers.map((n) => {
                          const js = s.judges.find((j) => j.judgeNumber === n);
                          return (
                            <div key={n} className="flex justify-between items-center">
                              <span className="text-sm font-medium text-muted-foreground">Judge {n}:</span>
                              <span className="text-sm">{js ? js.score : "-"}</span>
                            </div>
                          );
                        })}
                        <div className="flex justify-end gap-2 pt-2">
                          {hasAnyHistory(s) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openHistoryModal(s, group.event, group.eventId)}
                            >
                              <History className="h-4 w-4 mr-1" />
                              History
                            </Button>
                          )}
                          {canViewDetails && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigate(
                                  `/app/competition-portal/competition-details/${competitionId}/results/view_score_sheet?eventId=${group.eventId}&schoolId=${s.schoolId}&eventName=${encodeURIComponent(group.event)}`,
                                );
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="px-3 py-2 w-20">Rank</th>
                      <th className="px-3 py-2 min-w-[200px]">School</th>
                      {group.judgeNumbers.map((n) => (
                        <th key={n} className="px-3 py-2 w-24">
                          Judge {n}
                        </th>
                      ))}
                      <th className="px-3 py-2 w-24">Total</th>
                      <th className="px-3 py-2 w-28 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {group.schools.map((s, idx) => (
                      <tr key={s.schoolId} className="border-t">
                        <td className="px-3 py-2 w-20">{idx + 1}</td>
                        <td className="px-3 py-2 min-w-[200px]">{s.schoolName}</td>
                        {group.judgeNumbers.map((n) => {
                          const js = s.judges.find((j) => j.judgeNumber === n);
                          return (
                            <td key={n} className="px-3 py-2 w-24">
                              {js ? js.score : "-"}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 w-24 font-medium">{s.total.toFixed(1)}</td>
                        <td className="px-3 py-2 w-28">
                          <div className="flex items-center justify-center gap-2">
                            {canViewDetails && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                title="View Scores"
                                aria-label={`View score sheets for ${s.schoolName}`}
                                onClick={() => {
                                  navigate(
                                    `/app/competition-portal/competition-details/${competitionId}/results/view_score_sheet?eventId=${group.eventId}&schoolId=${s.schoolId}&eventName=${encodeURIComponent(group.event)}`,
                                  );
                                }}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            {hasAnyHistory(s) && (
                              <Button
                                variant="outline"
                                size="icon"
                                title="Score Change History"
                                className="h-8 w-8"
                                aria-label={`View history for ${s.schoolName}`}
                                onClick={() => openHistoryModal(s, group.event, group.eventId)}
                              >
                                <History className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <ScoreSheetHistoryModal
        isOpen={historyModal.isOpen}
        onClose={() =>
          setHistoryModal((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
        competitionId={competitionId}
        schoolId={historyModal.schoolId}
        eventId={historyModal.eventId}
        schoolName={historyModal.schoolName}
        eventName={historyModal.eventName}
      />
    </div>
  );
};
