-- CrmAccount: commune, startDate, endDate
ALTER TABLE "crm"."accounts" ADD COLUMN IF NOT EXISTS "commune" TEXT;
ALTER TABLE "crm"."accounts" ADD COLUMN IF NOT EXISTS "start_date" DATE;
ALTER TABLE "crm"."accounts" ADD COLUMN IF NOT EXISTS "end_date" DATE;

-- CrmInstallation: startDate, endDate
ALTER TABLE "crm"."installations" ADD COLUMN IF NOT EXISTS "start_date" DATE;
ALTER TABLE "crm"."installations" ADD COLUMN IF NOT EXISTS "end_date" DATE;

-- OpsGuardia: currentInstallationId, montoAnticipo, recibeAnticipo
ALTER TABLE "ops"."guardias" ADD COLUMN IF NOT EXISTS "current_installation_id" UUID;
ALTER TABLE "ops"."guardias" ADD COLUMN IF NOT EXISTS "monto_anticipo" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ops"."guardias" ADD COLUMN IF NOT EXISTS "recibe_anticipo" BOOLEAN NOT NULL DEFAULT false;

-- FK y índice para currentInstallationId
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'guardias_current_installation_id_fkey'
  ) THEN
    ALTER TABLE "ops"."guardias"
      ADD CONSTRAINT "guardias_current_installation_id_fkey"
      FOREIGN KEY ("current_installation_id")
      REFERENCES "crm"."installations"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_ops_guardias_current_installation"
  ON "ops"."guardias"("current_installation_id");
