-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Update Election Facts for Current Election Cycle
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Context:
--   - Ekiti State gubernatorial election has concluded (~2 weeks ago).
--   - Osun State gubernatorial election is the upcoming one.
--   - Hide Ekiti-related facts from the homepage carousel.
--   - Ensure Osun-related facts are visible.
--
-- Run: Connect to your Supabase SQL editor and execute this script.
-- ═══════════════════════════════════════════════════════════════════════════

-- Hide Ekiti election facts (the election has concluded)
UPDATE public.election_facts
SET display = false,
    updated_at = timezone('utc', now())
WHERE (LOWER(text) LIKE '%ekiti%' OR LOWER(category) LIKE '%ekiti%')
  AND display = true;

-- Ensure Osun election facts are displayed (upcoming election)
UPDATE public.election_facts
SET display = true,
    updated_at = timezone('utc', now())
WHERE (LOWER(text) LIKE '%osun%' OR LOWER(category) LIKE '%osun%');

-- Verify the changes
SELECT id, category, text, display
FROM public.election_facts
WHERE LOWER(text) LIKE '%ekiti%' OR LOWER(text) LIKE '%osun%'
   OR LOWER(category) LIKE '%ekiti%' OR LOWER(category) LIKE '%osun%';
