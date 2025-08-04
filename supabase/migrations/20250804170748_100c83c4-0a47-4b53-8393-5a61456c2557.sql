-- Add color field to cp_comp_schools table
ALTER TABLE cp_comp_schools ADD COLUMN IF NOT EXISTS color text DEFAULT '#3B82F6';

-- Create simplified function to assign random color
CREATE OR REPLACE FUNCTION public.assign_random_school_color()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  colors text[] := ARRAY[
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', 
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E', '#64748B', '#6B7280', '#78716C'
  ];
  random_color text;
BEGIN
  -- Select a random color from the array
  random_color := colors[floor(random() * array_length(colors, 1) + 1)];
  NEW.color := random_color;
  
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_assign_school_color ON cp_comp_schools;

-- Create trigger to assign random color on insert
CREATE TRIGGER trigger_assign_school_color
  BEFORE INSERT ON cp_comp_schools
  FOR EACH ROW
  EXECUTE FUNCTION assign_random_school_color();