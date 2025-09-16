-- Create a unified view for all competitions accessible to a school
CREATE OR REPLACE VIEW school_competitions AS
-- Internal competitions (created by the school)
SELECT 
  c.id,
  c.name,
  c.description,
  c.location,
  c.competition_date,
  c.registration_deadline,
  c.school_id,
  c.created_at,
  c.updated_at,
  'internal' as source_type,
  c.id as source_competition_id,
  c.comp_type,
  c.teams,
  c.cadets,
  c.overall_placement,
  c.overall_armed_placement,
  c.overall_unarmed_placement,
  c.armed_regulation,
  c.armed_exhibition,
  c.armed_color_guard,
  c.armed_inspection,
  c.unarmed_regulation,
  c.unarmed_exhibition,
  c.unarmed_color_guard,
  c.unarmed_inspection
FROM competitions c

UNION ALL

-- Portal competitions (school is registered for)
SELECT 
  cp.id,
  cp.name,
  cp.description,
  cp.location,
  cp.start_date as competition_date,
  cp.registration_deadline,
  ccs.school_id,
  cp.created_at,
  cp.updated_at,
  'portal' as source_type,
  cp.id as source_competition_id,
  cp.program as comp_type,
  NULL as teams,
  NULL as cadets,
  NULL as overall_placement,
  NULL as overall_armed_placement,
  NULL as overall_unarmed_placement,
  NULL as armed_regulation,
  NULL as armed_exhibition,
  NULL as armed_color_guard,
  NULL as armed_inspection,
  NULL as unarmed_regulation,
  NULL as unarmed_exhibition,
  NULL as unarmed_color_guard,
  NULL as unarmed_inspection
FROM cp_competitions cp
JOIN cp_comp_schools ccs ON cp.id = ccs.competition_id
WHERE ccs.status = 'registered';