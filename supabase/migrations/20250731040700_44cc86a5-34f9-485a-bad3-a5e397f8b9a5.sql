-- Create criteria_mappings table
CREATE TABLE public.criteria_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  display_name TEXT NOT NULL,
  original_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_global BOOLEAN NOT NULL DEFAULT false,
  school_id UUID NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.criteria_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view global and school mappings" 
ON public.criteria_mappings 
FOR SELECT 
USING (is_global = true OR school_id = get_current_user_school_id());

CREATE POLICY "Users can create mappings for their school" 
ON public.criteria_mappings 
FOR INSERT 
WITH CHECK (school_id = get_current_user_school_id() AND created_by = auth.uid());

CREATE POLICY "Users can update their school mappings" 
ON public.criteria_mappings 
FOR UPDATE 
USING (school_id = get_current_user_school_id())
WITH CHECK (school_id = get_current_user_school_id());

CREATE POLICY "Admins can manage global mappings" 
ON public.criteria_mappings 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Function to increment mapping usage
CREATE OR REPLACE FUNCTION public.increment_mapping_usage(mapping_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.criteria_mappings 
  SET usage_count = usage_count + 1, updated_at = now()
  WHERE id = mapping_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find similar criteria using fuzzy matching
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
    -- Simple similarity based on word overlap
    (
      SELECT COUNT(*)::FLOAT / GREATEST(
        array_length(string_to_array(lower(criteria_text), ' '), 1),
        array_length(string_to_array(lower(criteria_item::text), ' '), 1)
      )
      FROM jsonb_array_elements_text(cm.original_criteria) AS criteria_item
      WHERE lower(criteria_item::text) LIKE '%' || ANY(string_to_array(lower(criteria_text), ' ')) || '%'
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as similarity_score
  FROM public.criteria_mappings cm
  WHERE cm.event_type = event_type_param
    AND (cm.is_global = true OR cm.school_id = get_current_user_school_id())
  ORDER BY usage_count DESC, similarity_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated timestamp trigger
CREATE TRIGGER update_criteria_mappings_updated_at
  BEFORE UPDATE ON public.criteria_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();