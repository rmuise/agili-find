-- One-time fix: null out venues where lat=0, lng=0 (Null Island)
-- These were written by scrapers that returned 0,0 when no coordinates were available.
-- PostGIS treats (0,0) as the Gulf of Guinea, so these venues are excluded from
-- all geo-radius searches even when location=null should mean "include everywhere".
-- Setting location=NULL and geocode_status='failed' triggers re-geocoding on next scrape.
UPDATE venues
SET
  location = NULL,
  geocode_status = 'failed'
WHERE
  location IS NOT NULL
  AND ST_X(location::geometry) = 0
  AND ST_Y(location::geometry) = 0
  AND geocode_status = 'success';
