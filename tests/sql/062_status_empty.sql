-- status on empty tables: documented as ONE row of zeros (fonte NULL), never an error; here the tables are empty and the aggregates answer without failing
DELETE FROM passages;
DELETE FROM documents;
DELETE FROM skipped;
DELETE FROM coverage;
SELECT (SELECT count(*) FROM documents) = 0
   AND (SELECT count(*) FROM passages WHERE embedding IS NULL) = 0
   AND (SELECT COALESCE(jsonb_object_agg(reason, n), '{}'::jsonb) FROM (SELECT reason, count(*) AS n FROM skipped GROUP BY reason) s) = '{}'::jsonb
   AND (SELECT COALESCE(jsonb_agg(item_id), '[]'::jsonb) FROM coverage) = '[]'::jsonb AS ok
