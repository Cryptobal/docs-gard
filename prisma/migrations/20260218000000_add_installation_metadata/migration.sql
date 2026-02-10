-- Add metadata JSONB column to installations (for dotación sugerida, etc.)
ALTER TABLE "crm"."installations" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
