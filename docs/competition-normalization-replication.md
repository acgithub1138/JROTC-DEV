# Competition Normalization System - Replication Guide

This document provides a complete explanation of how the Overall Competition score normalization works, including the mathematical formula, implementation details, and data requirements for replicating in another project.

---

## Table of Contents
1. [Overview](#overview)
2. [The Formula](#the-formula)
3. [Step-by-Step Calculation](#step-by-step-calculation)
4. [Data Requirements](#data-requirements)
5. [Database Schema](#database-schema)
6. [Code Implementation](#code-implementation)
7. [Usage Example](#usage-example)
8. [Key Design Decisions](#key-design-decisions)

---

## Overview

The normalization system calculates a fair overall competition score when:
- Events have different maximum possible points (e.g., Inspection = 500 pts, Regulation = 1000 pts)
- Events have different importance weights (e.g., Regulation = 1.5x, Color Guard = 1.0x)
- Schools may have multiple judges scoring the same event
- Some events may be marked as "required" for eligibility

**The goal**: A school that gets 80% on all events should rank the same regardless of which specific events they competed in.

---

## The Formula

### Master Formula
```
Overall Score = Σ (normalizedEventScore × weightFraction) × 100
```

### Component Breakdown

**1. Normalized Event Score (0-1 scale)**
```
normalizedEventScore = totalJudgeScores / (maxPoints × judgeCount)
```

**2. Weight Fraction (relative importance)**
```
weightFraction = eventWeight / totalWeightOfAllEventsSchoolParticipatedIn
```

**3. Final Score (0-100 percentage)**
```
finalScore = overallScore × 100
```

---

## Step-by-Step Calculation

### Example Scenario
A school competes in 3 events with 2 judges each:

| Event | Max Points | Weight | Judge 1 | Judge 2 | Total |
|-------|------------|--------|---------|---------|-------|
| Inspection | 500 | 1.0 | 400 | 450 | 850 |
| Regulation | 1000 | 1.5 | 800 | 900 | 1700 |
| Color Guard | 300 | 1.0 | 240 | 270 | 510 |

### Step 1: Calculate Normalized Score per Event

```
Inspection:  850 / (500 × 2) = 850 / 1000 = 0.85 (85%)
Regulation:  1700 / (1000 × 2) = 1700 / 2000 = 0.85 (85%)
Color Guard: 510 / (300 × 2) = 510 / 600 = 0.85 (85%)
```

### Step 2: Calculate Total Weight
```
totalWeight = 1.0 + 1.5 + 1.0 = 3.5
```

### Step 3: Calculate Weight Fractions
```
Inspection:  1.0 / 3.5 = 0.286 (28.6%)
Regulation:  1.5 / 3.5 = 0.429 (42.9%)
Color Guard: 1.0 / 3.5 = 0.286 (28.6%)
```

### Step 4: Calculate Weighted Sum
```
overallScore = (0.85 × 0.286) + (0.85 × 0.429) + (0.85 × 0.286)
             = 0.243 + 0.365 + 0.243
             = 0.851
```

### Step 5: Convert to Percentage
```
finalScore = 0.851 × 100 = 85.1%
```

**Result**: The school scores 85.1% overall, which correctly reflects their consistent 85% performance across all events.

---

## Data Requirements

### Required Data Points

1. **Competition Events** (scores submitted by judges)
   - `event` - Event type ID (FK to event types)
   - `school_id` - Which school this score belongs to
   - `total_points` - The score from this judge
   - `score_sheet` - JSON containing judge details (optional, for judge number)

2. **Event Metadata** (per-competition event configuration)
   - `event` - Event type ID
   - `max_points` - Maximum possible points for this event
   - `weight` - Relative importance weight (default: 1.0)
   - `required` - Boolean, if true schools must compete to be eligible

3. **School Mapping**
   - `school_id` → `school_name` lookup

4. **Event Types** (global event definitions)
   - `id` - Event type UUID
   - `name` - Display name
   - `category` - "armed" or "unarmed" (for category filtering)

---

## Database Schema

### competition_events (scores)
```sql
CREATE TABLE competition_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event UUID REFERENCES competition_event_types(id),
  school_id UUID NOT NULL,
  total_points NUMERIC,
  score_sheet JSONB,
  source_type TEXT, -- 'portal' for competition portal entries
  source_competition_id UUID, -- links to the competition
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### cp_comp_events (event configuration per competition)
```sql
CREATE TABLE cp_comp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL,
  event UUID REFERENCES competition_event_types(id),
  max_points INTEGER,
  weight NUMERIC DEFAULT 1.0,
  required BOOLEAN DEFAULT false,
  -- other fields...
);
```

### competition_event_types (global event definitions)
```sql
CREATE TABLE competition_event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'other', -- 'armed', 'unarmed', 'other'
  weight NUMERIC DEFAULT 1.0,
  -- other fields...
);
```

### cp_comp_schools (registered schools)
```sql
CREATE TABLE cp_comp_schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL,
  school_id UUID,
  school_name TEXT,
  -- other fields...
);
```

---

## Code Implementation

### TypeScript Interfaces

```typescript
// Types for the ranking system
export interface SchoolRanking {
  schoolId: string;
  schoolName: string;
  totalPoints: number;  // Final percentage score (0-100)
  eventCount: number;   // Number of unique events participated in
}

export interface EventMetadata {
  maxPoints: number;    // Maximum possible points for this event
  weight: number;       // Relative importance weight
  required: boolean;    // Whether participation is required for eligibility
}

export interface CompetitionEventRow {
  id: string;
  event: string;           // Event type ID
  total_points: number | null;
  score_sheet: any;        // JSON with judge details
  school_id: string;
}
```

### Eligibility Filter Function

```typescript
/**
 * Determines which schools are eligible based on required event participation.
 * Returns null if no required events (all schools eligible).
 * Returns Set of eligible school IDs if required events exist.
 */
export function determineEligibleSchools(
  rows: CompetitionEventRow[],
  eventMetadata: Record<string, EventMetadata>
): Set<string> | null {
  // Get all required event IDs
  const requiredEventIds = Object.entries(eventMetadata)
    .filter(([_, meta]) => meta.required)
    .map(([eventId]) => eventId);

  // If no required events, all schools are eligible
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
```

### Main Normalization Function

```typescript
/**
 * Calculate normalized rankings for Overall Competition.
 * Uses weighted normalization where each event's score is normalized to 0-100%
 * and weighted by its relative weight fraction.
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

    const rawScore = typeof r.total_points === "number" 
      ? r.total_points 
      : Number(r.total_points) || 0;
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
        // Normalize: aggregated score / (maxPoints × judgeCount) = 0-1 scale
        const normalized = e.totalScore / (e.maxPoints * e.judgeCount);
        // Weight fraction: this event's weight / total of all weights
        const wFraction = e.weight / totalWeight;
        overallScore += normalized * wFraction;
      });

      return {
        schoolId,
        schoolName: data.schoolName,
        totalPoints: overallScore * 100, // Convert to percentage (0-100)
        eventCount: Object.keys(data.events).length,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints); // Sort descending
}
```

---

## Usage Example

### React Component Integration

```tsx
import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  determineEligibleSchools,
  calculateNormalizedRankings,
  type CompetitionEventRow,
  type EventMetadata,
} from "@/utils/competitionRankingCalculations";

function CompetitionResults({ competitionId }: { competitionId: string }) {
  const [rows, setRows] = useState<CompetitionEventRow[]>([]);
  const [schoolMap, setSchoolMap] = useState<Record<string, string>>({});
  const [eventMetadata, setEventMetadata] = useState<Record<string, EventMetadata>>({});

  useEffect(() => {
    async function fetchData() {
      // Fetch competition events (scores)
      const { data: events } = await supabase
        .from("competition_events")
        .select("id, event, total_points, score_sheet, school_id")
        .eq("source_type", "portal")
        .eq("source_competition_id", competitionId);

      // Fetch registered schools
      const { data: schools } = await supabase
        .from("cp_comp_schools")
        .select("school_id, school_name")
        .eq("competition_id", competitionId);

      // Fetch event configuration
      const { data: compEvents } = await supabase
        .from("cp_comp_events")
        .select("event, max_points, weight, required")
        .eq("competition_id", competitionId);

      // Build school name map
      const nameMap: Record<string, string> = {};
      schools?.forEach((s) => {
        if (s.school_id) nameMap[s.school_id] = s.school_name || "Unknown";
      });

      // Build event metadata map
      const metaMap: Record<string, EventMetadata> = {};
      compEvents?.forEach((e) => {
        if (e.event) {
          metaMap[e.event] = {
            maxPoints: e.max_points || 0,
            weight: e.weight || 1.0,
            required: e.required || false,
          };
        }
      });

      setRows(events || []);
      setSchoolMap(nameMap);
      setEventMetadata(metaMap);
    }

    fetchData();
  }, [competitionId]);

  // Calculate eligible schools
  const eligibleSchools = useMemo(() => 
    determineEligibleSchools(rows, eventMetadata), 
    [rows, eventMetadata]
  );

  // Calculate normalized rankings
  const rankings = useMemo(() => 
    calculateNormalizedRankings(rows, schoolMap, eventMetadata, eligibleSchools),
    [rows, schoolMap, eventMetadata, eligibleSchools]
  );

  return (
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>School</th>
          <th>Score</th>
          <th>Events</th>
        </tr>
      </thead>
      <tbody>
        {rankings.map((school, index) => (
          <tr key={school.schoolId}>
            <td>{index + 1}</td>
            <td>{school.schoolName}</td>
            <td>{school.totalPoints.toFixed(2)}%</td>
            <td>{school.eventCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Key Design Decisions

### 1. Why Normalize?
Without normalization, a school that only competes in high-point events would unfairly dominate. Normalization ensures all events contribute proportionally regardless of their max points.

### 2. Why Use Relative Weights?
If a school skips an event, we don't penalize them with a zero for that event's weight. Instead, we redistribute weights among the events they actually competed in. This allows fair comparison between schools with different event participation.

### 3. Why Aggregate Judge Scores?
Multiple judges score the same event. We sum their scores and divide by `(maxPoints × judgeCount)` to get the true percentage performance across all judges.

### 4. Why Required Events?
Some competitions require participation in specific events (e.g., Inspection) for eligibility. Schools that skip required events are excluded from overall rankings entirely.

### 5. Category Rankings Use Raw Points
The Armed/Unarmed category tabs use raw point totals (not normalized) because they're comparing events within the same category where max points are typically similar.

---

## Files to Copy

For a complete replication, copy these files:

1. **Core Calculation Logic**
   - `src/utils/competitionRankingCalculations.ts`

2. **UI Components** (optional)
   - `src/components/competition-portal/tabs/CompetitionResultsTab.tsx`
   - `src/components/competition-portal/tabs/results/OverallRankingsTab.tsx`

3. **Database Migrations** (adapt to your schema)
   - Tables: `competition_events`, `cp_comp_events`, `cp_comp_schools`, `competition_event_types`

---

## Edge Function Sync Note

If you also use server-side calculations (e.g., for generating placements), keep the edge function in sync:
- `supabase/functions/generate-competition-placements/index.ts`

The comment at the top of `competitionRankingCalculations.ts` reminds developers to update both locations when changing the algorithm.
