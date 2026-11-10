-- Keep a permanent lesson id on each post. The integer lesson column stays
-- as the day number from the original course, so older rows still resolve.
ALTER TABLE ai30_posts ADD COLUMN IF NOT EXISTS lesson_id text;

UPDATE ai30_posts
SET lesson_id = CASE lesson
  WHEN 1 THEN 'pick-your-ai'
  WHEN 2 THEN 'writing-style'
  WHEN 3 THEN 'brand-guidelines'
  WHEN 4 THEN 'brain-dump'
  WHEN 5 THEN 'dead-leads'
  WHEN 6 THEN 'decision-log'
  WHEN 7 THEN 'inbox'
  WHEN 8 THEN 'reviews'
  WHEN 9 THEN 'share-posts'
  WHEN 10 THEN 'social-strategy'
  WHEN 11 THEN 'first-posts'
  WHEN 12 THEN 'book-appointments'
  WHEN 13 THEN 'keep-notes'
  WHEN 14 THEN 'past-clients'
  WHEN 15 THEN 'listing-descriptions'
  WHEN 16 THEN 'letter-of-opinion'
  WHEN 17 THEN 'time-a-letter'
  WHEN 18 THEN 'coles-notes'
  WHEN 19 THEN 'deal-deadlines'
  WHEN 20 THEN 'deal-card'
  WHEN 21 THEN 'ten-leads'
  WHEN 22 THEN 'paste-notes'
  WHEN 23 THEN 'listing-paperwork'
  WHEN 24 THEN 'brokerbay'
  WHEN 25 THEN 'handoff-1'
  WHEN 26 THEN 'handoff-2'
  WHEN 27 THEN 'handoff-3'
  WHEN 28 THEN 'handoff-4'
  WHEN 29 THEN 'handoff-5'
  WHEN 30 THEN 'handoff-6'
  WHEN 31 THEN 'final-review'
  ELSE lesson_id
END
WHERE lesson_id IS NULL OR btrim(lesson_id) = '';
