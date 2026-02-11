-- Phase 1 hardening: Personas/Guardias lifecycle, address, banking and history

ALTER TABLE "ops"."personas"
ADD COLUMN "phone_mobile" TEXT,
ADD COLUMN "address_formatted" TEXT,
ADD COLUMN "google_place_id" TEXT,
ADD COLUMN "address_line_1" TEXT,
ADD COLUMN "commune" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "region" TEXT,
ADD COLUMN "lat" DECIMAL(10,7),
ADD COLUMN "lng" DECIMAL(10,7),
ADD COLUMN "address_source" TEXT DEFAULT 'google_places';

CREATE INDEX "idx_ops_personas_google_place_id" ON "ops"."personas"("google_place_id");

ALTER TABLE "ops"."guardias"
ADD COLUMN "lifecycle_status" TEXT NOT NULL DEFAULT 'postulante',
ADD COLUMN "hired_at" DATE,
ADD COLUMN "terminated_at" DATE,
ADD COLUMN "termination_reason" TEXT;

CREATE INDEX "idx_ops_guardias_lifecycle_status" ON "ops"."guardias"("lifecycle_status");

ALTER TABLE "ops"."cuentas_bancarias"
ADD COLUMN "bank_code" TEXT;

CREATE INDEX "idx_ops_cuentas_bancarias_bank_code" ON "ops"."cuentas_bancarias"("bank_code");

ALTER TABLE "ops"."documentos_persona"
ADD COLUMN "validated_by" TEXT,
ADD COLUMN "validated_at" TIMESTAMPTZ(6);

CREATE TABLE "ops"."guardia_history" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "tenant_id" TEXT NOT NULL,
  "guardia_id" UUID NOT NULL,
  "event_type" TEXT NOT NULL,
  "previous_value" JSONB,
  "new_value" JSONB,
  "reason" TEXT,
  "created_by" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "guardia_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "guardia_history_guardia_id_fkey" FOREIGN KEY ("guardia_id") REFERENCES "ops"."guardias"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_ops_guardia_history_tenant" ON "ops"."guardia_history"("tenant_id");
CREATE INDEX "idx_ops_guardia_history_guardia" ON "ops"."guardia_history"("guardia_id");
CREATE INDEX "idx_ops_guardia_history_event_type" ON "ops"."guardia_history"("event_type");

