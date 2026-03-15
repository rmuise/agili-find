-- Add count_trials RPC to return accurate total matching rows
-- (nearby_trials only returns the current page, making pagination impossible)
CREATE OR REPLACE FUNCTION count_trials(
  search_lat DOUBLE PRECISION,
  search_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION,
  org_filter TEXT[] DEFAULT NULL,
  judge_filter TEXT DEFAULT NULL,
  class_filter TEXT[] DEFAULT NULL,
  date_start DATE DEFAULT NULL,
  date_end DATE DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  total BIGINT;
BEGIN
  SELECT COUNT(*)
  INTO total
  FROM trials t
  JOIN venues v ON t.venue_id = v.id
  WHERE
    -- Location filter (mirrors nearby_trials)
    (search_lat IS NULL OR ST_DWithin(
      v.location,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
      radius_meters
    ))
    -- Organization filter
    AND (org_filter IS NULL OR t.organization_id = ANY(org_filter))
    -- Judge filter (case-insensitive partial match)
    AND (judge_filter IS NULL OR EXISTS (
      SELECT 1 FROM unnest(t.judges) j WHERE j ILIKE '%' || judge_filter || '%'
    ))
    -- Class filter
    AND (class_filter IS NULL OR t.classes && class_filter)
    -- Date range filter
    AND (date_start IS NULL OR t.start_date >= date_start)
    AND (date_end IS NULL OR t.start_date <= date_end)
    -- Only future/current trials
    AND t.end_date >= CURRENT_DATE;

  RETURN total;
END;
$$;
