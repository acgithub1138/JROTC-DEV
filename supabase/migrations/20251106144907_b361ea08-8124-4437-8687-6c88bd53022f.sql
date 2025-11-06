-- Function to update competition statuses based on dates
CREATE OR REPLACE FUNCTION update_competition_statuses()
RETURNS jsonb AS $$
DECLARE
  closed_count INTEGER := 0;
  in_progress_count INTEGER := 0;
  completed_count INTEGER := 0;
BEGIN
  -- Update to "Registration Closed" if registration_deadline is today
  UPDATE cp_competitions
  SET status = 'closed',
      updated_at = now()
  WHERE status NOT IN ('closed', 'in_progress', 'completed')
    AND registration_deadline::date = CURRENT_DATE;
  
  GET DIAGNOSTICS closed_count = ROW_COUNT;

  -- Update to "In Progress" if start_date is today
  UPDATE cp_competitions
  SET status = 'in_progress',
      updated_at = now()
  WHERE status NOT IN ('in_progress', 'completed')
    AND start_date::date = CURRENT_DATE;
  
  GET DIAGNOSTICS in_progress_count = ROW_COUNT;

  -- Update to "Completed" if end_date is today
  UPDATE cp_competitions
  SET status = 'completed',
      updated_at = now()
  WHERE status != 'completed'
    AND end_date::date = CURRENT_DATE;
  
  GET DIAGNOSTICS completed_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'closed_count', closed_count,
    'in_progress_count', in_progress_count,
    'completed_count', completed_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;