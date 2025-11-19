-- Remove duplicate sets with "1st Edition" suffix
-- Cards and slabs will be merged into main sets, with first_edition flag set to true
-- This migration consolidates sets like "Base Set 1st Edition" into "Base Set"

-- Map of 1st Edition sets to their main set names
-- Format: '1st Edition Set Name' -> 'Main Set Name'
DO $$
DECLARE
  set_mapping RECORD;
  main_set_name TEXT;
  first_edition_set_name TEXT;
  cards_updated INTEGER;
  slabs_updated INTEGER;
BEGIN
  -- List of set pairs: (1st Edition Set Name, Main Set Name)
  FOR set_mapping IN 
    SELECT * FROM (VALUES
      ('Base Set 1st Edition', 'Base Set'),
      ('Jungle 1st Edition', 'Jungle'),
      ('Fossil 1st Edition', 'Fossil'),
      ('Team Rocket 1st Edition', 'Team Rocket'),
      ('Gym Heroes 1st Edition', 'Gym Heroes'),
      ('Gym Challenge 1st Edition', 'Gym Challenge'),
      ('Neo Genesis 1st Edition', 'Neo Genesis'),
      ('Neo Discovery 1st Edition', 'Neo Discovery'),
      ('Neo Revelation 1st Edition', 'Neo Revelation'),
      ('Neo Destiny 1st Edition', 'Neo Destiny')
    ) AS pairs(first_edition_name, main_name)
  LOOP
    first_edition_set_name := set_mapping.first_edition_name;
    main_set_name := set_mapping.main_name;
    
    RAISE NOTICE 'Processing: % -> %', first_edition_set_name, main_set_name;
    
    -- Update cards: change set_name from "X 1st Edition" to "X"
    UPDATE public.cards
    SET set_name = main_set_name,
        updated_at = timezone('utc'::text, now())
    WHERE set_name = first_edition_set_name;
    
    GET DIAGNOSTICS cards_updated = ROW_COUNT;
    RAISE NOTICE '  Updated % cards', cards_updated;
    
    -- Update slabs: change set_name and set first_edition = true
    UPDATE public.slabs
    SET set_name = main_set_name,
        first_edition = true,
        updated_at = timezone('utc'::text, now())
    WHERE set_name = first_edition_set_name;
    
    GET DIAGNOSTICS slabs_updated = ROW_COUNT;
    RAISE NOTICE '  Updated % slabs (set first_edition = true)', slabs_updated;
    
    -- Delete the duplicate set from sets table
    DELETE FROM public.sets
    WHERE name = first_edition_set_name;
    
    RAISE NOTICE '  Deleted set: %', first_edition_set_name;
    RAISE NOTICE '';
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully!';
END $$;

-- Verify: Check if any 1st Edition sets remain
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM public.sets
  WHERE name LIKE '%1st Edition%';
  
  IF remaining_count > 0 THEN
    RAISE WARNING 'Found % remaining sets with "1st Edition" in name. Please review manually.', remaining_count;
  ELSE
    RAISE NOTICE 'No remaining sets with "1st Edition" in name. All duplicates removed.';
  END IF;
END $$;

