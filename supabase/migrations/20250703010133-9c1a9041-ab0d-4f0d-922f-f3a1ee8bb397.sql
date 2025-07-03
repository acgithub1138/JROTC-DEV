-- Create inventory_history table to track changes
CREATE TABLE public.inventory_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  school_id UUID NOT NULL REFERENCES public.schools(id)
);

-- Enable RLS
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory history
CREATE POLICY "Users can view inventory history from their school" 
ON public.inventory_history 
FOR SELECT 
USING (school_id = get_current_user_school_id());

CREATE POLICY "System can insert inventory history" 
ON public.inventory_history 
FOR INSERT 
WITH CHECK (school_id = get_current_user_school_id());

-- Create function to log inventory changes
CREATE OR REPLACE FUNCTION public.log_inventory_changes()
RETURNS TRIGGER AS $$
DECLARE
  change_record RECORD;
  user_id UUID;
BEGIN
  -- Get the current user ID (may be null for system changes)
  user_id := auth.uid();
  
  -- Check qty_total changes
  IF OLD.qty_total IS DISTINCT FROM NEW.qty_total THEN
    INSERT INTO public.inventory_history (
      item_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'qty_total', 
      COALESCE(OLD.qty_total::text, 'null'), 
      COALESCE(NEW.qty_total::text, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  -- Check qty_issued changes
  IF OLD.qty_issued IS DISTINCT FROM NEW.qty_issued THEN
    INSERT INTO public.inventory_history (
      item_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'qty_issued', 
      COALESCE(OLD.qty_issued::text, 'null'), 
      COALESCE(NEW.qty_issued::text, 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  -- Check issued_to changes (array comparison)
  IF OLD.issued_to IS DISTINCT FROM NEW.issued_to THEN
    INSERT INTO public.inventory_history (
      item_id, field_name, old_value, new_value, changed_by, school_id
    ) VALUES (
      NEW.id, 'issued_to', 
      COALESCE(array_to_string(OLD.issued_to, ', '), 'null'), 
      COALESCE(array_to_string(NEW.issued_to, ', '), 'null'),
      user_id, NEW.school_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on inventory_items
CREATE TRIGGER inventory_changes_trigger
  AFTER UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.log_inventory_changes();

-- Create index for better performance
CREATE INDEX idx_inventory_history_item_id ON public.inventory_history(item_id);
CREATE INDEX idx_inventory_history_created_at ON public.inventory_history(created_at DESC);