import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompetitionResultsPermissions } from "@/hooks/useModuleSpecificPermissions";
import { ScoreSheetHistoryModal } from "../components/ScoreSheetHistoryModal";
import { OverallRankingsTab } from "./results/OverallRankingsTab";
import { EventResultsTab } from "./results/EventResultsTab";
import { AllResultsBySchoolTab } from "./results/AllResultsBySchoolTab";

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

interface EventTypeRow {
  id: string;
  name: string;
  category: string;
}

interface SchoolRanking {
  schoolId: string;
  schoolName: string;
  totalPoints: number;
  eventCount: number;
}

interface EventMetadata {
  maxPoints: number;
  weight: number;
  required: boolean;
}

export const CompetitionResultsTab: React.FC<CompetitionResultsTabProps> = ({ competitionId }) => {
  const { canView, canViewDetails } = useCompetitionResultsPermissions();
  const [rows, setRows] = useState<CompetitionEventRow[]>([]);
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

    setRows(eventsWithHistory as CompetitionEventRow[]);

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

  // Determine which schools are eligible based on required events
  const eligibleSchools = useMemo(() => {
    // Get all required event IDs for this competition
    const requiredEventIds = Object.entries(eventMetadata)
      .filter(([_, meta]) => meta.required)
      .map(([eventId]) => eventId);

    // If no required events, all schools are eligible (return null to indicate no filtering)
    if (requiredEventIds.length === 0) {
      return null;
    }

    // Build map of which events each school participated in
    const schoolEvents: Record<string, Set<string>> = {};
    rows.forEach((r) => {
      if (!schoolEvents[r.school_id]) {
        schoolEvents[r.school_id] = new Set();
      }
      schoolEvents[r.school_id].add(r.event);
    });

    // Only include schools that have ALL required events
    const eligibleSchoolIds = new Set<string>();
    Object.entries(schoolEvents).forEach(([schoolId, events]) => {
      const hasAllRequired = requiredEventIds.every((reqId) => events.has(reqId));
      if (hasAllRequired) {
        eligibleSchoolIds.add(schoolId);
      }
    });

    return eligibleSchoolIds;
  }, [rows, eventMetadata]);

  // Calculate normalized rankings for Overall Competition tab
  const calculateNormalizedRankings = (): SchoolRanking[] => {
    // Collect each school's event scores with metadata, aggregating by event
    const schoolData: Record<string, {
      schoolName: string;
      events: Record<string, {
        totalScore: number;
        maxPoints: number;
        weight: number;
        judgeCount: number;
      }>;
    }> = {};

    rows.forEach((r) => {
      // Skip if school is not eligible (when required events exist)
      if (eligibleSchools && !eligibleSchools.has(r.school_id)) return;

      const meta = eventMetadata[r.event];
      if (!meta || meta.maxPoints <= 0) return; // Skip events without valid metadata

      const rawScore = typeof r.total_points === "number" ? r.total_points : Number(r.total_points) || 0;
      const schoolName = schoolMap[r.school_id] || "Unknown School";

      if (!schoolData[r.school_id]) {
        schoolData[r.school_id] = { schoolName, events: {} };
      }
      
      // Aggregate scores by event (sum all judge scores for this event)
      if (!schoolData[r.school_id].events[r.event]) {
        schoolData[r.school_id].events[r.event] = {
          totalScore: 0,
          maxPoints: meta.maxPoints,
          weight: meta.weight,
          judgeCount: 0,
        };
      }
      schoolData[r.school_id].events[r.event].totalScore += rawScore;
      schoolData[r.school_id].events[r.event].judgeCount += 1;
    });

    // Calculate normalized weighted scores
    return Object.entries(schoolData)
      .map(([schoolId, data]) => {
        const eventsList = Object.values(data.events);
        const totalWeight = eventsList.reduce((sum, e) => sum + e.weight, 0);
        
        let overallScore = 0;
        eventsList.forEach((e) => {
          // Use aggregated score divided by (maxPoints * judgeCount) for normalization
          const normalized = e.totalScore / (e.maxPoints * e.judgeCount); // 0-1 scale
          const wFraction = e.weight / totalWeight;    // relative weight
          overallScore += normalized * wFraction;
        });

        return {
          schoolId,
          schoolName: data.schoolName,
          totalPoints: overallScore * 100, // Convert to percentage (0-100)
          eventCount: Object.keys(data.events).length, // Count unique events
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);
  };

  // Calculate rankings by total points for category tabs (Armed/Unarmed)
  const calculateRankings = (filterCategory: string): SchoolRanking[] => {
    const schoolTotals: Record<string, { totalPoints: number; uniqueEvents: Set<string>; schoolName: string }> = {};

    rows.forEach((r) => {
      // Skip if school is not eligible (when required events exist)
      if (eligibleSchools && !eligibleSchools.has(r.school_id)) return;

      const category = eventCategoryMap[r.event] || "other";
      if (category !== filterCategory) return;

      const points = typeof r.total_points === "number" ? r.total_points : Number(r.total_points) || 0;
      const schoolName = schoolMap[r.school_id] || "Unknown School";

      if (!schoolTotals[r.school_id]) {
        schoolTotals[r.school_id] = { totalPoints: 0, uniqueEvents: new Set(), schoolName };
      }
      schoolTotals[r.school_id].totalPoints += points;
      schoolTotals[r.school_id].uniqueEvents.add(r.event); // Track unique events
    });

    return Object.entries(schoolTotals)
      .map(([schoolId, data]) => ({
        schoolId,
        schoolName: data.schoolName,
        totalPoints: data.totalPoints,
        eventCount: data.uniqueEvents.size, // Count unique events
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
  };

  const overallRankings = useMemo(() => calculateNormalizedRankings(), [rows, schoolMap, eventMetadata, eligibleSchools]);
  const armedRankings = useMemo(() => calculateRankings("armed"), [rows, schoolMap, eventCategoryMap, eligibleSchools]);
  const unarmedRankings = useMemo(() => calculateRankings("unarmed"), [rows, schoolMap, eventCategoryMap, eligibleSchools]);

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
