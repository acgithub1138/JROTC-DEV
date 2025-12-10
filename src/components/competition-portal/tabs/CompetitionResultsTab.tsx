import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompetitionResultsPermissions } from "@/hooks/useModuleSpecificPermissions";
import { ScoreSheetHistoryModal } from "../components/ScoreSheetHistoryModal";
import { OverallRankingsTab } from "./results/OverallRankingsTab";
import { EventResultsTab } from "./results/EventResultsTab";
import { AllResultsBySchoolTab } from "./results/AllResultsBySchoolTab";
import {
  determineEligibleSchools,
  calculateNormalizedRankings,
  calculateCategoryRankings,
  type CompetitionEventRow,
  type EventMetadata,
  type EventTypeRow,
} from "@/utils/competitionRankingCalculations";

interface CompetitionResultsTabProps {
  competitionId: string;
}

// Extended type with additional fields for UI display
interface CompetitionEventRowWithHistory extends CompetitionEventRow {
  has_history?: boolean;
}

interface CPSchoolRow {
  school_id: string;
  school_name: string | null;
}

export const CompetitionResultsTab: React.FC<CompetitionResultsTabProps> = ({ competitionId }) => {
  const { canView, canViewDetails } = useCompetitionResultsPermissions();
  const [rows, setRows] = useState<CompetitionEventRowWithHistory[]>([]);
  const [schoolMap, setSchoolMap] = useState<Record<string, string>>({});
  const [eventTypes, setEventTypes] = useState<EventTypeRow[]>([]);
  const [eventMetadata, setEventMetadata] = useState<Record<string, EventMetadata>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("competition");
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
    const [eventsRes, schoolsRes, eventTypesRes, historyRes, compEventsRes] = await Promise.all([
      supabase
        .from("competition_events")
        .select("id, event, total_points, score_sheet, school_id, created_at")
        .eq("source_type", "portal")
        .eq("source_competition_id", competitionId),
      supabase.from("cp_comp_schools").select("school_id, school_name").eq("competition_id", competitionId),
      supabase.from("competition_event_types").select("id, name, category"),
      supabase.from("competition_events_history").select("competition_event_id"),
      supabase.from("cp_comp_events").select("event, max_points, weight, required").eq("competition_id", competitionId),
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

    const eventIdsWithHistory = new Set((historyRes.data || []).map((h) => h.competition_event_id));
    const eventsWithHistory = (eventsRes.data || []).map((event) => ({
      ...event,
      has_history: eventIdsWithHistory.has(event.id),
    }));

    setRows(eventsWithHistory as CompetitionEventRowWithHistory[]);

    const schoolNameMap: Record<string, string> = {};
    (schoolsRes.data || []).forEach((s: CPSchoolRow) => {
      if (s.school_id) schoolNameMap[s.school_id] = s.school_name || "Unknown School";
    });
    setSchoolMap(schoolNameMap);
    setEventTypes(eventTypesRes.data || []);

    // Build event metadata map for normalized scoring
    const metadataMap: Record<string, EventMetadata> = {};
    (compEventsRes.data || []).forEach((e) => {
      if (e.event) {
        metadataMap[e.event] = {
          maxPoints: e.max_points || 0,
          weight: e.weight || 1.0,
          required: e.required || false,
        };
      }
    });
    setEventMetadata(metadataMap);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [competitionId]);

  // Create maps for quick lookups
  const eventMap = useMemo(() => {
    const map: Record<string, string> = {};
    eventTypes.forEach((e) => {
      map[e.id] = e.name;
    });
    return map;
  }, [eventTypes]);

  const eventCategoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    eventTypes.forEach((e) => {
      map[e.id] = e.category || "other";
    });
    return map;
  }, [eventTypes]);

  // Determine which schools are eligible based on required events - using centralized utility
  const eligibleSchools = useMemo(() => {
    return determineEligibleSchools(rows, eventMetadata);
  }, [rows, eventMetadata]);

  // Calculate rankings using centralized utility functions
  const overallRankings = useMemo(() => 
    calculateNormalizedRankings(rows, schoolMap, eventMetadata, eligibleSchools), 
    [rows, schoolMap, eventMetadata, eligibleSchools]
  );
  
  const armedRankings = useMemo(() => 
    calculateCategoryRankings(rows, schoolMap, eventCategoryMap, eligibleSchools, "armed"), 
    [rows, schoolMap, eventCategoryMap, eligibleSchools]
  );
  
  const unarmedRankings = useMemo(() => 
    calculateCategoryRankings(rows, schoolMap, eventCategoryMap, eligibleSchools, "unarmed"), 
    [rows, schoolMap, eventCategoryMap, eligibleSchools]
  );

  // Group events for the Events tab
  const grouped = useMemo(() => {
    type JudgeScore = { judgeNumber?: number; score: number };
    type SchoolAgg = {
      schoolId: string;
      schoolName: string;
      judges: JudgeScore[];
      total: number;
      eventRecords: CompetitionEventRow[];
    };

    const result = new Map<string, {
      event: string;
      eventId: string;
      schools: SchoolAgg[];
      judgeNumbers: number[];
    }>();

    const eventGroupMap: Record<string, {
      schoolsMap: Map<string, SchoolAgg>;
      judgeSet: Set<number>;
      eventKey: string;
      eventId: string;
    }> = {};

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
      // Skip if school is not eligible (when required events exist)
      if (eligibleSchools && !eligibleSchools.has(r.school_id)) return;

      const eventId = r.event || "Unknown";
      const eventName = eventMap[eventId] || "Unknown Event";

      if (!eventGroupMap[eventName]) {
        eventGroupMap[eventName] = {
          schoolsMap: new Map(),
          judgeSet: new Set(),
          eventKey: eventName,
          eventId,
        };
      }

      const { schoolsMap, judgeSet } = eventGroupMap[eventName];
      const schoolId = r.school_id;
      const schoolName = schoolMap[schoolId] || "Unknown School";
      const score = typeof r.total_points === "number" ? r.total_points : Number(r.total_points) || 0;
      const judgeNumber = getJudgeNumber(r.score_sheet);

      if (judgeNumber !== undefined) judgeSet.add(judgeNumber);

      let agg = schoolsMap.get(schoolId);
      if (!agg) {
        agg = { schoolId, schoolName, judges: [], total: 0, eventRecords: [] };
        schoolsMap.set(schoolId, agg);
      }
      agg.judges.push({ judgeNumber, score });
      agg.total += score;
      agg.eventRecords.push(r);
    });

    Object.keys(eventGroupMap).forEach((ev) => {
      const { schoolsMap, judgeSet, eventKey, eventId } = eventGroupMap[ev];
      const schools = Array.from(schoolsMap.values());

      schools.forEach((s) => {
        s.judges.sort((a, b) => (a.judgeNumber ?? 9999) - (b.judgeNumber ?? 9999));
      });
      schools.sort((a, b) => b.total - a.total);

      const judgeNumbers = Array.from(judgeSet.values()).sort((a, b) => a - b);
      result.set(ev, { event: eventKey, eventId, schools, judgeNumbers });
    });

    return result;
  }, [rows, schoolMap, eventMap, eligibleSchools]);

  const openHistoryModal = (schoolAgg: any, eventName: string, eventId: string) => {
    setHistoryModal({
      isOpen: true,
      competitionEventId: "",
      schoolId: schoolAgg.schoolId,
      eventId: eventId,
      schoolName: schoolAgg.schoolName,
      eventName: eventName,
    });
  };

  if (!canView) {
    return <div className="p-4 text-sm text-muted-foreground">You don't have permission to view results.</div>;
  }

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading results...</div>;
  if (error) return <div className="p-4 text-sm text-destructive">Error: {error}</div>;
  if (rows.length === 0) return <div className="p-4 text-sm text-muted-foreground">No results submitted yet.</div>;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="competition">Competition</TabsTrigger>
          <TabsTrigger value="armed">Armed</TabsTrigger>
          <TabsTrigger value="unarmed">Unarmed</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="competition">
          <OverallRankingsTab rankings={overallRankings} title="Overall Competition" isNormalized />
        </TabsContent>

        <TabsContent value="armed">
          <OverallRankingsTab rankings={armedRankings} title="Armed Events" />
        </TabsContent>

        <TabsContent value="unarmed">
          <OverallRankingsTab rankings={unarmedRankings} title="Unarmed Events" />
        </TabsContent>

        <TabsContent value="events">
          <EventResultsTab
            grouped={grouped}
            competitionId={competitionId}
            canViewDetails={canViewDetails}
            onOpenHistory={openHistoryModal}
          />
        </TabsContent>

        <TabsContent value="all">
          <AllResultsBySchoolTab grouped={grouped} schoolMap={schoolMap} />
        </TabsContent>
      </Tabs>

      <ScoreSheetHistoryModal
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal((prev) => ({ ...prev, isOpen: false }))}
        competitionId={competitionId}
        schoolId={historyModal.schoolId}
        eventId={historyModal.eventId}
        schoolName={historyModal.schoolName}
        eventName={historyModal.eventName}
      />
    </div>
  );
};
