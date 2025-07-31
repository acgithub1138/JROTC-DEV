-- Fix the find_similar_criteria function
CREATE OR REPLACE FUNCTION public.find_similar_criteria(criteria_text TEXT, event_type_param TEXT)
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  original_criteria JSONB,
  usage_count INTEGER,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.display_name,
    cm.original_criteria,
    cm.usage_count,
    -- Simplified similarity calculation
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(cm.original_criteria) AS criteria_item
        WHERE lower(criteria_item::text) ILIKE '%' || lower(criteria_text) || '%'
      ) THEN 0.8
      WHEN EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(cm.original_criteria) AS criteria_item
        WHERE lower(criteria_item::text) ILIKE '%' || split_part(lower(criteria_text), ' ', 1) || '%'
      ) THEN 0.5
      ELSE 0.1
    END as similarity_score
  FROM public.criteria_mappings cm
  WHERE cm.event_type = event_type_param
    AND (cm.is_global = true OR cm.school_id = get_current_user_school_id())
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(cm.original_criteria) AS criteria_item
      WHERE lower(criteria_item::text) ILIKE '%' || lower(split_part(criteria_text, ' ', 1)) || '%'
         OR lower(criteria_item::text) ILIKE '%' || lower(criteria_text) || '%'
    )
  ORDER BY similarity_score DESC, usage_count DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';