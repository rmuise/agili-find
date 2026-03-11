-- RPC function to find trials near a location within a radius
CREATE OR REPLACE FUNCTION nearby_trials(
  search_lat DOUBLE PRECISION,
  search_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION,
  org_filter TEXT[] DEFAULT NULL,
  judge_filter TEXT DEFAULT NULL,
  class_filter TEXT[] DEFAULT NULL,
  date_start DATE DEFAULT NULL,
  date_end DATE DEFAULT NULL,
  result_limit INTEGER DEFAULT 100,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  trial_id UUID,
  title TEXT,
  hosting_club TEXT,
  organization_id TEXT,
  organization_name TEXT,
  start_date DATE,
  end_date DATE,
  entry_close_date DATE,
  classes TEXT[],
  judges TEXT[],
  source_url TEXT,
  venue_name TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS trial_id,
    t.title,
    t.hosting_club,
    t.organization_id,
    o.name AS organization_name,
    t.start_date,
    t.end_date,
    t.entry_close_date,
    t.classes,
    t.judges,
    t.source_url,
    v.name AS venue_name,
    v.city,
    v.state,
    v.country,
    ST_Y(v.location::geometry) AS lat,
    ST_X(v.location::geometry) AS lng,
    ST_Distance(
      v.location,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography
    ) AS distance_meters
  FROM trials t
  JOIN venues v ON t.venue_id = v.id
  JOIN organizations o ON t.organization_id = o.id
  WHERE
    -- Location filter
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
    AND t.end_date >= CURRENT_DATE
  ORDER BY
    CASE WHEN search_lat IS NOT NULL THEN
      ST_Distance(
        v.location,
        ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography
      )
    ELSE NULL END ASC NULLS LAST,
    t.start_date ASC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;
