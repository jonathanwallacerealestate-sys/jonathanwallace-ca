-- One-time cleanup for the bootcamp board.
-- Removes the host's practice post and two named practice rows.
-- Replies disappear with the post because parent_id uses ON DELETE CASCADE.

DELETE FROM ai30_posts
WHERE btrim(body) IN ('That was a cool lesson.', 'That was a cool lesson');

DELETE FROM ai30_posts
WHERE name_key IN ('zztest council', 'zztest selfie');

DELETE FROM ai30_logins
WHERE name_key IN ('zztest council', 'zztest selfie');

DELETE FROM ai30_progress
WHERE name_key IN ('zztest council', 'zztest selfie');
