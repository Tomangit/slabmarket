-- Fix duplicate sets and remove broken IDs
-- This migration:
-- 1. Identifies duplicate sets (same name + language)
-- 2. Keeps sets with valid PokemonTCG API IDs (format: lowercase letters + numbers only, e.g., "swsh10", "xy7")
-- 3. Removes duplicates with broken IDs (e.g., "english--lack-and-hite")
-- 4. Updates cards pointing to removed sets to use the correct set name

-- Step 1: Identify valid PokemonTCG API ID format
-- Valid IDs: only lowercase letters and numbers, no dashes/underscores, max 50 chars
-- Examples: base1, xy7, swsh10, sv3pt5, swsh10tg
-- Invalid: english--lack-and-hite, english-base-set

-- Step 2: Find duplicate sets (same name + language)
-- For each duplicate group, keep the one with valid ID, or if both invalid, keep the shorter one

DO $$
DECLARE
  duplicate_count INTEGER;
  removed_count INTEGER;
  updated_cards_count INTEGER;
BEGIN
  -- Create temporary table with duplicate sets info
  CREATE TEMP TABLE IF NOT EXISTS duplicate_sets_analysis AS
  WITH set_groups AS (
    SELECT 
      name,
      language,
      id,
      CASE 
        WHEN id ~ '^[a-z0-9]+$' AND length(id) <= 50 THEN true
        ELSE false
      END as has_valid_id,
      ROW_NUMBER() OVER (
        PARTITION BY name, language 
        ORDER BY 
          CASE WHEN id ~ '^[a-z0-9]+$' AND length(id) <= 50 THEN 0 ELSE 1 END, -- valid IDs first
          length(id) ASC, -- shorter IDs preferred if both invalid
          id ASC -- alphabetical tiebreaker
      ) as rn
    FROM public.sets
  )
  SELECT 
    name,
    language,
    id as set_id_to_remove,
    (SELECT id FROM set_groups sg2 
     WHERE sg2.name = sg1.name 
       AND sg2.language = sg1.language 
       AND sg2.rn = 1) as set_id_to_keep
  FROM set_groups sg1
  WHERE rn > 1; -- duplicates (not the first/kept one)

  GET DIAGNOSTICS duplicate_count = ROW_COUNT;
  RAISE NOTICE 'Found % duplicate set groups to clean up', duplicate_count;

  -- Step 3: Update cards that reference sets to be removed
  -- Change set_name to match the kept set (they should have same name, but ensure consistency)
  WITH duplicates_to_fix AS (
    SELECT DISTINCT set_id_to_remove, set_id_to_keep
    FROM duplicate_sets_analysis
  ),
  kept_sets AS (
    SELECT id, name, language
    FROM public.sets
    WHERE id IN (SELECT set_id_to_keep FROM duplicates_to_fix)
  )
  UPDATE public.cards c
  SET set_name = ks.name
  FROM duplicates_to_fix dtf
  JOIN kept_sets ks ON ks.id = dtf.set_id_to_keep
  WHERE c.set_name = (SELECT name FROM public.sets WHERE id = dtf.set_id_to_remove)
    AND c.set_name != ks.name; -- only update if different (shouldn't happen, but safety check)

  GET DIAGNOSTICS updated_cards_count = ROW_COUNT;
  RAISE NOTICE 'Updated % cards to reference correct set names', updated_cards_count;

  -- Step 4: Remove duplicate sets (keep the ones with valid IDs)
  DELETE FROM public.sets
  WHERE id IN (SELECT set_id_to_remove FROM duplicate_sets_analysis);

  GET DIAGNOSTICS removed_count = ROW_COUNT;
  RAISE NOTICE 'Removed % duplicate sets', removed_count;

  -- Step 5: Also remove any sets with obviously broken IDs that don't match PokemonTCG API format
  -- These are sets with double dashes or invalid patterns
  DELETE FROM public.sets
  WHERE id LIKE '%--%' -- double dashes (broken)
     OR id !~ '^[a-z0-9]+$' -- not just lowercase letters and numbers
     OR length(id) > 50; -- too long

  GET DIAGNOSTICS removed_count = ROW_COUNT;
  RAISE NOTICE 'Removed % additional sets with broken IDs', removed_count;

  -- Cleanup temp table
  DROP TABLE IF EXISTS duplicate_sets_analysis;

  RAISE NOTICE 'Migration completed successfully';
END $$;

-- Verify: Check for remaining duplicates
DO $$
DECLARE
  remaining_duplicates INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_duplicates
  FROM (
    SELECT name, language, COUNT(*) as cnt
    FROM public.sets
    GROUP BY name, language
    HAVING COUNT(*) > 1
  ) dup_check;

  IF remaining_duplicates > 0 THEN
    RAISE WARNING 'Still found % duplicate set groups after cleanup', remaining_duplicates;
  ELSE
    RAISE NOTICE 'No duplicate sets remaining - cleanup successful';
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE public.sets IS 'Pokemon TCG sets. IDs should match PokemonTCG API format (lowercase letters + numbers only, e.g., swsh10, xy7). Duplicates removed by this migration.';



