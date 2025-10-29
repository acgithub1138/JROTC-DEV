-- Add composite index for efficient score sheet lookup by judges
-- This index optimizes queries that filter by event, competition, and judge
-- Expected improvement: Query time from ~100ms to ~5-10ms for 200 schools

CREATE INDEX IF NOT EXISTS idx_competition_events_lookup 
ON competition_events(event, source_competition_id, created_by);

-- Add comment for documentation
COMMENT ON INDEX idx_competition_events_lookup IS 'Optimizes judge portal score sheet existence checks';
