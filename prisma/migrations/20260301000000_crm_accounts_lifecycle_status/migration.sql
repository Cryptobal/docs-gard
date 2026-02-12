-- Unify CRM account lifecycle status:
-- prospect | client_active | client_inactive
-- Keep type/is_active synchronized for backward compatibility.

-- 1) Backfill status from existing fields.
UPDATE "crm"."accounts"
SET "status" = CASE
  WHEN "status" = 'prospect' THEN 'prospect'
  WHEN "status" = 'client_active' THEN 'client_active'
  WHEN "status" = 'client_inactive' THEN 'client_inactive'
  WHEN LOWER(COALESCE("type", 'prospect')) = 'prospect' THEN 'prospect'
  WHEN COALESCE("is_active", FALSE) = TRUE THEN 'client_active'
  ELSE 'client_inactive'
END;

-- 2) Sync legacy fields from canonical status.
UPDATE "crm"."accounts"
SET
  "type" = CASE
    WHEN "status" = 'prospect' THEN 'prospect'
    ELSE 'client'
  END,
  "is_active" = CASE
    WHEN "status" = 'client_active' THEN TRUE
    ELSE FALSE
  END;

-- 3) Update defaults for new rows.
ALTER TABLE "crm"."accounts"
ALTER COLUMN "status" SET DEFAULT 'prospect';

ALTER TABLE "crm"."accounts"
ALTER COLUMN "is_active" SET DEFAULT FALSE;
