import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScoreField {
  id: string;
  name: string;
  type: string;
  maxValue?: number;
  minValue?: number;
  options?: { label: string; value: string | number }[];
  penaltyType?: string;
  pointValue?: number;
  splitFirstValue?: number;
  splitSubsequentValue?: number;
  penaltyValue?: number;
}

interface TemplateScores {
  criteria: ScoreField[];
}

// Generate a sanitized field key matching existing format
function generateFieldKey(index: number, fieldName: string): string {
  const sanitized = fieldName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .trim();
  return `field_${index}_${sanitized}`;
}

// Generate random score for a number field
function generateNumberScore(field: ScoreField): number {
  const max = field.maxValue || 10;
  const min = field.minValue || 0;
  // Generate score between 70-95% of max for realistic variety
  const percentage = 0.70 + Math.random() * 0.25;
  return Math.floor(min + (max - min) * percentage);
}

// Generate random dropdown selection
function generateDropdownScore(field: ScoreField): number | string {
  if (!field.options || field.options.length === 0) return 0;
  // Prefer higher values (better scores) - weight towards end of options
  const weightedIndex = Math.floor(Math.pow(Math.random(), 0.5) * field.options.length);
  const option = field.options[Math.min(weightedIndex, field.options.length - 1)];
  return option.value;
}

// Generate penalty score for Judge 1 (with random penalties)
function generatePenaltyScoreJudge1(field: ScoreField): number | string {
  if (field.penaltyType === 'points') {
    // 80% chance of 0, 20% chance of 1-3 violations
    return Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 1 : 0;
  }
  if (field.penaltyType === 'minor_major') {
    // 90% none, 7% minor, 3% major
    const rand = Math.random();
    if (rand > 0.97) return 'major';
    if (rand > 0.90) return 'minor';
    return '';
  }
  if (field.penaltyType === 'split') {
    // 85% chance of 0, 15% chance of 1-2 occurrences
    return Math.random() > 0.85 ? Math.floor(Math.random() * 2) + 1 : 0;
  }
  if (field.penaltyType === 'checkbox_list') {
    return 0; // No checkbox penalties for simplicity
  }
  // Default penalty checkbox type
  return Math.random() > 0.85 ? Math.floor(Math.random() * 2) + 1 : 0;
}

// Generate penalty score for Judge 2 (no penalties)
function generatePenaltyScoreJudge2(field: ScoreField): number | string {
  if (field.penaltyType === 'minor_major') return '';
  return 0;
}

// Calculate total score using the same logic as scoreCalculations.ts
function calculateTotalScore(fields: ScoreField[], scores: Record<string, any>): number {
  let total = 0;

  fields.forEach(field => {
    const fieldValue = scores[field.id];
    if (fieldValue === null || fieldValue === undefined || fieldValue === '') return;

    const valueNum = typeof fieldValue === 'number' ? fieldValue : Number(fieldValue);

    if (field.type === 'number' && !isNaN(valueNum)) {
      total += valueNum;
    } else if (field.type === 'dropdown' && !isNaN(valueNum)) {
      total += valueNum;
    } else if (field.type === 'scoring_scale' && !isNaN(valueNum)) {
      total += valueNum;
    } else if (field.type === 'penalty' || field.type === 'penalty_checkbox') {
      const penalty = calculatePenaltyDeduction(field, fieldValue);
      if (penalty !== null) total += penalty;
    }
  });

  return total;
}

// Calculate penalty deduction
function calculatePenaltyDeduction(field: ScoreField, value: any): number | null {
  if (!value || (typeof value !== 'number' && typeof value !== 'string' && typeof value !== 'boolean')) {
    return null;
  }

  const numValue = typeof value === 'number' ? value : Number(value);

  if (field.type === 'penalty') {
    if (field.penaltyType === 'points') {
      const violations = numValue || 0;
      const pointValue = field.pointValue || -10;
      return violations > 0 ? violations * pointValue : null;
    }
    if (field.penaltyType === 'minor_major') {
      if (value === 'minor') return -20;
      if (value === 'major') return -50;
      return null;
    }
    if (field.penaltyType === 'split') {
      const occurrences = numValue || 0;
      if (occurrences >= 1) {
        const firstValue = field.splitFirstValue || -5;
        const subsequentValue = field.splitSubsequentValue || -25;
        if (occurrences === 1) return firstValue;
        return firstValue + (occurrences - 1) * subsequentValue;
      }
      return null;
    }
  }

  if (field.type === 'penalty_checkbox') {
    const count = numValue || 0;
    const penaltyValue = field.penaltyValue || -10;
    return count > 0 ? count * penaltyValue : null;
  }

  return null;
}

// Generate scores for a template
function generateScoresForTemplate(
  templateScores: TemplateScores,
  judgeNumber: number
): { scores: Record<string, any>; total: number } {
  const scores: Record<string, any> = {};
  
  if (!templateScores.criteria || !Array.isArray(templateScores.criteria)) {
    return { scores: {}, total: 0 };
  }

  templateScores.criteria.forEach((field, index) => {
    const fieldKey = generateFieldKey(index, field.name);
    
    if (field.type === 'number') {
      scores[fieldKey] = generateNumberScore(field);
    } else if (field.type === 'dropdown' || field.type === 'scoring_scale') {
      scores[fieldKey] = generateDropdownScore(field);
    } else if (field.type === 'penalty' || field.type === 'penalty_checkbox') {
      scores[fieldKey] = judgeNumber === 1 
        ? generatePenaltyScoreJudge1(field) 
        : generatePenaltyScoreJudge2(field);
    } else if (field.type === 'text') {
      scores[fieldKey] = ''; // Empty text fields
    }
  });

  // Calculate total using field keys as IDs
  const fieldsWithKeys = templateScores.criteria.map((field, index) => ({
    ...field,
    id: generateFieldKey(index, field.name)
  }));
  
  const total = calculateTotalScore(fieldsWithKeys, scores);

  return { scores, total };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { competition_id } = await req.json();
    
    if (!competition_id) {
      throw new Error('competition_id is required');
    }

    console.log(`Generating demo score sheets for competition: ${competition_id}`);

    // 1. Get all events for this competition with their score sheet templates
    const { data: events, error: eventsError } = await supabase
      .from('cp_comp_events')
      .select('id, event, score_sheet')
      .eq('competition_id', competition_id)
      .not('score_sheet', 'is', null);

    if (eventsError) throw eventsError;
    console.log(`Found ${events?.length || 0} events with templates`);

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No events with score sheet templates found' 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Get all templates
    const templateIds = [...new Set(events.map(e => e.score_sheet).filter(Boolean))];
    const { data: templates, error: templatesError } = await supabase
      .from('competition_templates')
      .select('id, scores')
      .in('id', templateIds);

    if (templatesError) throw templatesError;
    console.log(`Found ${templates?.length || 0} templates`);

    const templateMap = new Map(templates?.map(t => [t.id, t.scores]) || []);

    // 3. Get judge assignments with their user_ids
    const eventIds = events.map(e => e.id);
    const { data: judgeAssignments, error: judgesError } = await supabase
      .from('cp_comp_judges')
      .select(`
        id,
        event,
        judge,
        cp_judges!inner(id, user_id)
      `)
      .eq('competition_id', competition_id)
      .in('event', eventIds);

    if (judgesError) throw judgesError;
    console.log(`Found ${judgeAssignments?.length || 0} judge assignments`);

    // Group judges by event and assign judge numbers
    const judgesByEvent = new Map<string, Array<{ judgeId: string; userId: string; judgeNumber: number }>>();
    
    judgeAssignments?.forEach(assignment => {
      const eventId = assignment.event;
      if (!judgesByEvent.has(eventId)) {
        judgesByEvent.set(eventId, []);
      }
      const judges = judgesByEvent.get(eventId)!;
      const cpJudge = assignment.cp_judges as any;
      judges.push({
        judgeId: assignment.judge,
        userId: cpJudge?.user_id,
        judgeNumber: judges.length + 1
      });
    });

    // 4. Get event registrations
    const { data: registrations, error: regsError } = await supabase
      .from('cp_event_registrations')
      .select('id, event_id, school_id')
      .eq('competition_id', competition_id)
      .eq('status', 'registered');

    if (regsError) throw regsError;
    console.log(`Found ${registrations?.length || 0} event registrations`);

    // 5. Generate score sheets
    const scoreSheets: any[] = [];
    let skipped = 0;

    for (const registration of registrations || []) {
      const event = events.find(e => e.id === registration.event_id);
      if (!event || !event.score_sheet) {
        skipped++;
        continue;
      }

      const templateScores = templateMap.get(event.score_sheet);
      if (!templateScores) {
        skipped++;
        continue;
      }

      // Parse template scores if string
      let parsedTemplate: TemplateScores;
      try {
        parsedTemplate = typeof templateScores === 'string' 
          ? JSON.parse(templateScores) 
          : templateScores;
      } catch {
        console.error(`Failed to parse template ${event.score_sheet}`);
        skipped++;
        continue;
      }

      const judges = judgesByEvent.get(event.id) || [];
      if (judges.length === 0) {
        console.log(`No judges assigned to event ${event.id}`);
        skipped++;
        continue;
      }

      // Generate one score sheet per judge
      for (const judge of judges) {
        if (!judge.userId) {
          console.log(`Judge ${judge.judgeId} has no user_id, skipping`);
          continue;
        }

        const { scores, total } = generateScoresForTemplate(parsedTemplate, judge.judgeNumber);
        
        scoreSheets.push({
          school_id: registration.school_id,
          event: event.event, // The event type ID, not cp_comp_events ID
          created_by: judge.userId,
          source_type: 'portal',
          source_competition_id: competition_id,
          total_points: total,
          score_sheet: {
            template_id: event.score_sheet,
            judge_number: judge.judgeNumber,
            calculated_at: new Date().toISOString(),
            scores
          }
        });
      }
    }

    console.log(`Generated ${scoreSheets.length} score sheets, skipped ${skipped} registrations`);

    // 6. Insert score sheets
    if (scoreSheets.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('competition_events')
        .insert(scoreSheets)
        .select('id');

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log(`Successfully inserted ${inserted?.length || 0} score sheets`);

      return new Response(JSON.stringify({
        success: true,
        message: `Generated ${inserted?.length || 0} score sheets`,
        details: {
          events: events.length,
          registrations: registrations?.length || 0,
          judgeAssignments: judgeAssignments?.length || 0,
          scoreSheetsCreated: inserted?.length || 0,
          skipped
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'No score sheets generated',
      details: { skipped }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error generating demo score sheets:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
