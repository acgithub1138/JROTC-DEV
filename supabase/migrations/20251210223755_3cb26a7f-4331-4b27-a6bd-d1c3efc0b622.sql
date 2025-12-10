-- Create function to call the edge function when competition status changes to 'completed'
CREATE OR REPLACE FUNCTION public.trigger_placement_generation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes TO 'completed' (not already completed)
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Use pg_notify to send a notification that can be caught by a listener
    -- The edge function will be called via HTTP from a scheduled job or webhook
    PERFORM pg_notify(
      'competition_completed',
      json_build_object(
        'competition_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )::text
    );
    
    -- Log the event for debugging
    RAISE LOG 'Competition % status changed to completed. Placement generation triggered.', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on cp_competitions status change
DROP TRIGGER IF EXISTS on_competition_completed ON public.cp_competitions;

CREATE TRIGGER on_competition_completed
AFTER UPDATE OF status ON public.cp_competitions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_placement_generation();

-- Add comment for documentation
COMMENT ON FUNCTION public.trigger_placement_generation() IS 
'Triggers placement generation when a competition status changes to completed. 
The edge function generate-competition-placements should be called to process this.';
