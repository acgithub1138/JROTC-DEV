import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Calculate the current school year
 * School years run August - May
 */
const getCurrentSchoolYear = (): number => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based (0 = January, 7 = August)
  
  return currentMonth >= 7 ? currentYear : currentYear - 1;
};

/**
 * Calculate grade based on freshman year and current school year
 */
const calculateGrade = (freshmanYear: number): string => {
  const currentSchoolYear = getCurrentSchoolYear();
  const difference = currentSchoolYear - freshmanYear;
  
  switch (difference) {
    case 0:
      return 'Freshman';
    case 1:
      return 'Sophomore';
    case 2:
      return 'Junior';
    case 3:
      return 'Senior';
    default:
      return difference >= 4 ? 'Graduate' : 'Freshman';
  }
};

/**
 * Increment cadet year by 1
 */
const incrementCadetYear = (currentYear: string | null): string => {
  if (!currentYear) return '1st Year';
  
  switch (currentYear) {
    case '1st':
      return '2nd';
    case '2nd':
      return '3rd';
    case '3rd':
      return '4th';
    case '4th':
      return '4th';
    default:
      return '1st';
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting annual cadet update process...');

    // Get all active cadets with start_year
    const { data: cadets, error: fetchError } = await supabase
      .from('profiles')
      .select('id, start_year, cadet_year, grade, active')
      .eq('active', true)
      .not('start_year', 'is', null);

    if (fetchError) {
      console.error('Error fetching cadets:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${cadets?.length || 0} active cadets to update`);

    let updatedCount = 0;
    let graduatedCount = 0;

    // Process each cadet
    for (const cadet of (cadets || []) as { id: string; start_year: number | null; cadet_year: string | null }[]) {
      const newGrade = calculateGrade(cadet.start_year!);
      const newCadetYear = incrementCadetYear(cadet.cadet_year);
      
      // Prepare update data
      const updateData: Record<string, any> = {
        grade: newGrade,
        cadet_year: newCadetYear,
        updated_at: new Date().toISOString()
      };

      // If cadet is now a graduate, set to inactive and clear flight
      if (newGrade === 'Graduate') {
        updateData.active = false;
        updateData.flight = null;
        graduatedCount++;
      }

      // Update the cadet
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', cadet.id);

      if (updateError) {
        console.error(`Error updating cadet ${cadet.id}:`, updateError);
        continue;
      }

      updatedCount++;
      console.log(`Updated cadet ${cadet.id}: ${newGrade}, ${newCadetYear}`);
    }

    const result = {
      success: true,
      totalProcessed: cadets?.length || 0,
      updated: updatedCount,
      graduated: graduatedCount,
      processedAt: new Date().toISOString(),
      currentSchoolYear: getCurrentSchoolYear()
    };

    console.log('Annual update completed:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in annual cadet update:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});