-- Logins, group posts, private email, and the selfie unlock flag.
-- Selfie image bytes live in Netlify Blobs, not in this table.

ALTER TABLE ai30_progress ADD COLUMN IF NOT EXISTS email varchar(120);
ALTER TABLE ai30_progress ADD COLUMN IF NOT EXISTS selfie_at timestamptz;

CREATE TABLE IF NOT EXISTS ai30_logins (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name_key varchar(81) NOT NULL,
  logged_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai30_logins_name_idx ON ai30_logins (name_key, logged_at);

CREATE TABLE IF NOT EXISTS ai30_posts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name_key varchar(81) NOT NULL,
  first_name varchar(40) NOT NULL,
  last_name varchar(40) NOT NULL,
  lesson integer NOT NULL,
  kind varchar(16) NOT NULL,
  body varchar(500) NOT NULL,
  parent_id bigint REFERENCES ai30_posts (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai30_posts_created_idx ON ai30_posts (created_at);
