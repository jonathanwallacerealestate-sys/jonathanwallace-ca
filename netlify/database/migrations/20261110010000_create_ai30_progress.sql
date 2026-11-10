-- Progress for the private /ai-30-days training portal.
-- One row per person. The key is the normalised first and last name.
-- days holds day statuses, notes, and done timestamps. Nothing else.

CREATE TABLE ai30_progress (
  name_key varchar(81) PRIMARY KEY,
  first_name varchar(40) NOT NULL,
  last_name varchar(40) NOT NULL,
  days jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
