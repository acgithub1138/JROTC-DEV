-- Add default event types for all schools that don't have them yet
INSERT INTO public.event_types (value, label, school_id, is_default)
SELECT 
  event_type.value,
  event_type.label,
  schools.id,
  true
FROM (
  VALUES 
    ('training', 'Training'),
    ('competition', 'Competition'),
    ('ceremony', 'Ceremony'),
    ('meeting', 'Meeting'),
    ('drill', 'Drill'),
    ('other', 'Other')
) AS event_type(value, label)
CROSS JOIN public.schools
WHERE NOT EXISTS (
  SELECT 1 FROM public.event_types et 
  WHERE et.value = event_type.value 
  AND et.school_id = schools.id
);