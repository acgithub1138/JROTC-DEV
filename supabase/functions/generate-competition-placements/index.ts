/**
 * Edge Function: Generate Competition Placements
 * 
 * Automatically generates placement records when a competition status changes to 'completed'.
 * 
 * IMPORTANT: The calculation logic in this file MUST be kept in sync with:
 * src/utils/competitionRankingCalculations.ts
 * 
 * If you update any calculation logic there, you MUST also update it here.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Types (matching src/utils/competitionRankingCalculations.ts)
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
  category: string;
}

interface CompetitionEventRow {
  id: string;
  event: string;
  total_points: number | null;
  school_id: string;
}

// ============================================================================
// CALCULATION FUNCTIONS - Keep in sync with src/utils/competitionRankingCalculations.ts
// ============================================================================

function determineEligibleSchools(
  rows: CompetitionEventRow[],
  eventMetadata: Record<string, EventMetadata>
): Set<string> | null {
  const requiredEventIds = Object.entries(eventMetadata)
    .filter(([_, meta]) => meta.required)
    .map(([eventId]) => eventId);

  if (requiredEventIds.length === 0) {
    return null;
  }

  const schoolEvents: Record<string, Set<string>> = {};
  rows.forEach((r) => {
    if (!schoolEvents[r.school_id]) {
      schoolEvents[r.school_id] = new Set();
    }
    schoolEvents[r.school_id].add(r.event);
  });

  const eligibleSchoolIds = new Set<string>();
  Object.entries(schoolEvents).forEach(([schoolId, events]) => {
    const hasAllRequired = requiredEventIds.every((reqId) => events.has(reqId));
    if (hasAllRequired) {
      eligibleSchoolIds.add(schoolId);
    }
  });

  return eligibleSchoolIds;
}

function calculateNormalizedRankings(
  rows: CompetitionEventRow[],
  schoolMap: Record<string, string>,
  eventMetadata: Record<string, EventMetadata>,
  eligibleSchools: Set<string> | null
): SchoolRanking[] {
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
    if (eligibleSchools && !eligibleSchools.has(r.school_id)) return;

    const meta = eventMetadata[r.event];
    if (!meta || meta.maxPoints <= 0) return;

    const rawScore = typeof r.total_points === "number" ? r.total_points : Number(r.total_points) || 0;
    const schoolName = schoolMap[r.school_id] || "Unknown School";

    if (!schoolData[r.school_id]) {
      schoolData[r.school_id] = { schoolName, events: {} };
    }

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

  return Object.entries(schoolData)
    .map(([schoolId, data]) => {
      const eventsList = Object.values(data.events);
      const totalWeight = eventsList.reduce((sum, e) => sum + e.weight, 0);

      let overallScore = 0;
      eventsList.forEach((e) => {
        const normalized = e.totalScore / (e.maxPoints * e.judgeCount);
        const wFraction = e.weight / totalWeight;
        overallScore += normalized * wFraction;
      });

      return {
        schoolId,
        schoolName: data.schoolName,
        totalPoints: overallScore * 100,
        eventCount: Object.keys(data.events).length,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

function calculateCategoryRankings(
  rows: CompetitionEventRow[],
  schoolMap: Record<string, string>,
  eventMetadata: Record<string, EventMetadata>,
  eligibleSchools: Set<string> | null,
  filterCategory: string
): SchoolRanking[] {
  const schoolTotals: Record<string, { totalPoints: number; uniqueEvents: Set<string>; schoolName: string }> = {};

  rows.forEach((r) => {
    if (eligibleSchools && !eligibleSchools.has(r.school_id)) return;

    const meta = eventMetadata[r.event];
    const category = meta?.category || "other";
    if (category !== filterCategory) return;

    const points = typeof r.total_points === "number" ? r.total_points : Number(r.total_points) || 0;
    const schoolName = schoolMap[r.school_id] || "Unknown School";

    if (!schoolTotals[r.school_id]) {
      schoolTotals[r.school_id] = { totalPoints: 0, uniqueEvents: new Set(), schoolName };
    }
    schoolTotals[r.school_id].totalPoints += points;
    schoolTotals[r.school_id].uniqueEvents.add(r.event);
  });

  return Object.entries(schoolTotals)
    .map(([schoolId, data]) => ({
      schoolId,
      schoolName: data.schoolName,
      totalPoints: data.totalPoints,
      eventCount: data.uniqueEvents.size,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

function calculateEventRankings(
  rows: CompetitionEventRow[],
  schoolMap: Record<string, string>,
  eventMap: Record<string, string>,
  eligibleSchools: Set<string> | null
): Map<string, { eventId: string; schools: Array<{ schoolId: string; schoolName: string; total: number }> }> {
  const eventGroupMap: Record<string, {
    schoolsMap: Map<string, { schoolId: string; schoolName: string; total: number }>;
    eventId: string;
  }> = {};

  rows.forEach((r) => {
    if (eligibleSchools && !eligibleSchools.has(r.school_id)) return;

    const eventId = r.event || "Unknown";
    const eventName = eventMap[eventId] || "Unknown Event";

    if (!eventGroupMap[eventName]) {
      eventGroupMap[eventName] = { schoolsMap: new Map(), eventId };
    }

    const { schoolsMap } = eventGroupMap[eventName];
    const schoolId = r.school_id;
    const schoolName = schoolMap[schoolId] || "Unknown School";
    const score = typeof r.total_points === "number" ? r.total_points : Number(r.total_points) || 0;

    let agg = schoolsMap.get(schoolId);
    if (!agg) {
      agg = { schoolId, schoolName, total: 0 };
      schoolsMap.set(schoolId, agg);
    }
    agg.total += score;
  });

  const result = new Map<string, { eventId: string; schools: Array<{ schoolId: string; schoolName: string; total: number }> }>();

  Object.entries(eventGroupMap).forEach(([eventName, { schoolsMap, eventId }]) => {
    const schools = Array.from(schoolsMap.values());
    schools.sort((a, b) => b.total - a.total);
    result.set(eventName, { eventId, schools });
  });

  return result;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { competition_id } = await req.json();

    if (!competition_id) {
      console.error("Missing competition_id");
      return new Response(
        JSON.stringify({ error: "Missing competition_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating placements for competition: ${competition_id}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch competition info
    const { data: competition, error: compError } = await supabase
      .from("cp_competitions")
      .select("id, start_date, school_id")
      .eq("id", competition_id)
      .single();

    if (compError || !competition) {
      console.error("Competition not found:", compError);
      return new Response(
        JSON.stringify({ error: "Competition not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all required data in parallel
    const [eventsRes, schoolsRes, eventTypesRes, compEventsRes] = await Promise.all([
      supabase
        .from("competition_events")
        .select("id, event, total_points, school_id")
        .eq("source_type", "portal")
        .eq("source_competition_id", competition_id),
      supabase
        .from("cp_comp_schools")
        .select("school_id, school_name")
        .eq("competition_id", competition_id),
      supabase
        .from("competition_event_types")
        .select("id, name, category"),
      supabase
        .from("cp_comp_events")
        .select("event, max_points, weight, required")
        .eq("competition_id", competition_id),
    ]);

    if (eventsRes.error || schoolsRes.error || eventTypesRes.error || compEventsRes.error) {
      console.error("Error fetching data:", eventsRes.error || schoolsRes.error || eventTypesRes.error || compEventsRes.error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch competition data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rows = eventsRes.data as CompetitionEventRow[];
    
    if (rows.length === 0) {
      console.log("No score sheets found for competition");
      return new Response(
        JSON.stringify({ success: true, message: "No score sheets to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build maps
    const schoolMap: Record<string, string> = {};
    (schoolsRes.data || []).forEach((s: { school_id: string; school_name: string | null }) => {
      if (s.school_id) schoolMap[s.school_id] = s.school_name || "Unknown School";
    });

    const eventMap: Record<string, string> = {};
    const eventCategoryMap: Record<string, string> = {};
    (eventTypesRes.data || []).forEach((e: { id: string; name: string; category: string }) => {
      eventMap[e.id] = e.name;
      eventCategoryMap[e.id] = e.category || "other";
    });

    const eventMetadata: Record<string, EventMetadata> = {};
    (compEventsRes.data || []).forEach((e: { event: string | null; max_points: number | null; weight: number | null; required: boolean | null }) => {
      if (e.event) {
        eventMetadata[e.event] = {
          maxPoints: e.max_points || 0,
          weight: e.weight || 1.0,
          required: e.required || false,
          category: eventCategoryMap[e.event] || "other",
        };
      }
    });

    // Calculate eligible schools
    const eligibleSchools = determineEligibleSchools(rows, eventMetadata);

    // Delete existing auto-generated placements for this competition
    const { error: deleteError } = await supabase
      .from("competition_placements")
      .delete()
      .eq("competition_id", competition_id)
      .eq("competition_source", "portal");

    if (deleteError) {
      console.error("Error deleting existing placements:", deleteError);
    }

    const placements: Array<{
      competition_id: string;
      competition_source: string;
      competition_date: string;
      school_id: string;
      event_name: string;
      placement: number;
    }> = [];

    const competitionDate = competition.start_date;

    // 1. Generate Overall placements (normalized scoring)
    const overallRankings = calculateNormalizedRankings(rows, schoolMap, eventMetadata, eligibleSchools);
    overallRankings.slice(0, 10).forEach((ranking, index) => {
      placements.push({
        competition_id,
        competition_source: "portal",
        competition_date: competitionDate,
        school_id: ranking.schoolId,
        event_name: "Overall",
        placement: index + 1,
      });
    });

    // 2. Generate Armed placements
    const armedRankings = calculateCategoryRankings(rows, schoolMap, eventMetadata, eligibleSchools, "armed");
    armedRankings.slice(0, 10).forEach((ranking, index) => {
      placements.push({
        competition_id,
        competition_source: "portal",
        competition_date: competitionDate,
        school_id: ranking.schoolId,
        event_name: "Overall Armed",
        placement: index + 1,
      });
    });

    // 3. Generate Unarmed placements
    const unarmedRankings = calculateCategoryRankings(rows, schoolMap, eventMetadata, eligibleSchools, "unarmed");
    unarmedRankings.slice(0, 10).forEach((ranking, index) => {
      placements.push({
        competition_id,
        competition_source: "portal",
        competition_date: competitionDate,
        school_id: ranking.schoolId,
        event_name: "Overall Unarmed",
        placement: index + 1,
      });
    });

    // 4. Generate per-event placements
    const eventRankings = calculateEventRankings(rows, schoolMap, eventMap, eligibleSchools);
    eventRankings.forEach((eventData, eventName) => {
      eventData.schools.slice(0, 10).forEach((school, index) => {
        placements.push({
          competition_id,
          competition_source: "portal",
          competition_date: competitionDate,
          school_id: school.schoolId,
          event_name: eventName,
          placement: index + 1,
        });
      });
    });

    // Insert all placements
    if (placements.length > 0) {
      const { error: insertError } = await supabase
        .from("competition_placements")
        .insert(placements);

      if (insertError) {
        console.error("Error inserting placements:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to insert placements" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`Successfully generated ${placements.length} placements for competition ${competition_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        placementsGenerated: placements.length,
        breakdown: {
          overall: overallRankings.slice(0, 10).length,
          armed: armedRankings.slice(0, 10).length,
          unarmed: unarmedRankings.slice(0, 10).length,
          events: placements.length - overallRankings.slice(0, 10).length - armedRankings.slice(0, 10).length - unarmedRankings.slice(0, 10).length,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
