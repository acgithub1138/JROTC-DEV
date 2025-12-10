/**
 * Centralized Competition Ranking Calculations
 * 
 * IMPORTANT: This file contains the single source of truth for all ranking calculations.
 * If you update any calculation logic here, you MUST also update the edge function:
 * supabase/functions/generate-competition-placements/index.ts
 * 
 * The edge function contains a copy of these calculations for Deno runtime compatibility.
 */

// Types
export interface SchoolRanking {
  schoolId: string;
  schoolName: string;
  totalPoints: number;
  eventCount: number;
}

export interface EventMetadata {
  maxPoints: number;
  weight: number;
  required: boolean;
}

export interface CompetitionEventRow {
  id: string;
  event: string;
  total_points: number | null;
  score_sheet: any;
  school_id: string;
  created_at?: string;
  has_history?: boolean;
}

export interface EventTypeRow {
  id: string;
  name: string;
  category: string;
}

/**
 * Determines which schools are eligible based on required event participation.
 * If no events are marked as required, returns null (all schools are eligible).
 * If any events are marked as required, only schools that participated in ALL required events are included.
 */
export function determineEligibleSchools(
  rows: CompetitionEventRow[],
  eventMetadata: Record<string, EventMetadata>
): Set<string> | null {
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
}

/**
 * Calculate normalized rankings for Overall Competition.
 * Uses weighted normalization where each event's score is normalized to 0-100% and
 * weighted by its relative weight fraction.
 */
export function calculateNormalizedRankings(
  rows: CompetitionEventRow[],
  schoolMap: Record<string, string>,
  eventMetadata: Record<string, EventMetadata>,
  eligibleSchools: Set<string> | null
): SchoolRanking[] {
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
}

/**
 * Calculate rankings by total points for category tabs (Armed/Unarmed).
 * Uses raw point totals without normalization.
 */
export function calculateCategoryRankings(
  rows: CompetitionEventRow[],
  schoolMap: Record<string, string>,
  eventCategoryMap: Record<string, string>,
  eligibleSchools: Set<string> | null,
  filterCategory: string
): SchoolRanking[] {
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
}

/**
 * Calculate per-event rankings.
 * Groups scores by event and ranks schools within each event.
 */
export function calculateEventRankings(
  rows: CompetitionEventRow[],
  schoolMap: Record<string, string>,
  eventMap: Record<string, string>,
  eligibleSchools: Set<string> | null
): Map<string, {
  event: string;
  eventId: string;
  schools: Array<{
    schoolId: string;
    schoolName: string;
    total: number;
  }>;
}> {
  const eventGroupMap: Record<string, {
    schoolsMap: Map<string, { schoolId: string; schoolName: string; total: number }>;
    eventKey: string;
    eventId: string;
  }> = {};

  rows.forEach((r) => {
    // Skip if school is not eligible (when required events exist)
    if (eligibleSchools && !eligibleSchools.has(r.school_id)) return;

    const eventId = r.event || "Unknown";
    const eventName = eventMap[eventId] || "Unknown Event";

    if (!eventGroupMap[eventName]) {
      eventGroupMap[eventName] = {
        schoolsMap: new Map(),
        eventKey: eventName,
        eventId,
      };
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

  const result = new Map<string, {
    event: string;
    eventId: string;
    schools: Array<{
      schoolId: string;
      schoolName: string;
      total: number;
    }>;
  }>();

  Object.keys(eventGroupMap).forEach((ev) => {
    const { schoolsMap, eventKey, eventId } = eventGroupMap[ev];
    const schools = Array.from(schoolsMap.values());
    schools.sort((a, b) => b.total - a.total);
    result.set(ev, { event: eventKey, eventId, schools });
  });

  return result;
}
