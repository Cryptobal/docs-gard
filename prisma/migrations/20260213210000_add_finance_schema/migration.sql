-- ============================================
-- Módulo de Rendiciones de Gastos (Finance)
-- ============================================

-- Create finance schema
CREATE SCHEMA IF NOT EXISTS "finance";

-- ── Configuración Global ──
CREATE TABLE "finance"."finance_rendicion_config" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "tenant_id" TEXT NOT NULL,
  "km_per_liter" DECIMAL(6,2) NOT NULL DEFAULT 10,
  "fuel_price_per_liter" INTEGER NOT NULL DEFAULT 1500,
  "vehicle_fee_pct" DECIMAL(5,2) NOT NULL DEFAULT 10,
  "require_image" BOOLEAN NOT NULL DEFAULT true,
  "require_observations" BOOLEAN NOT NULL DEFAULT false,
  "require_toll_image" BOOLEAN NOT NULL DEFAULT false,
  "default_approver_1_id" TEXT,
  "default_approver_2_id" TEXT,
  "max_daily_amount" INTEGER,
  "max_monthly_amount" INTEGER,
  "pending_alert_days" INTEGER NOT NULL DEFAULT 5,
  "approval_alert_days" INTEGER NOT NULL DEFAULT 3,
  "santander_account_number" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "finance_rendicion_config_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "finance_rendicion_config_tenant_id_key" ON "finance"."finance_rendicion_config"("tenant_id");

-- ── Ítems de rendición (catálogo configurable) ──
CREATE TABLE "finance"."finance_rendicion_items" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "tenant_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "category" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "max_per_day" INTEGER,
  "max_per_month" INTEGER,
  "account_code" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "finance_rendicion_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_finance_item_tenant_name" ON "finance"."finance_rendicion_items"("tenant_id", "name");
CREATE INDEX "idx_finance_items_tenant" ON "finance"."finance_rendicion_items"("tenant_id");

-- ── Centro de costo ──
CREATE TABLE "finance"."finance_cost_centers" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "tenant_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "installation_id" UUID,
  "account_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "finance_cost_centers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "uq_finance_cost_center_code" ON "finance"."finance_cost_centers"("tenant_id", "code");
CREATE INDEX "idx_finance_cost_centers_tenant" ON "finance"."finance_cost_centers"("tenant_id");

-- ── Pagos (lotes o individuales) ──
CREATE TABLE "finance"."finance_payments" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "tenant_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'MANUAL',
  "bank_file_name" TEXT,
  "bank_file_url" TEXT,
  "total_amount" INTEGER NOT NULL,
  "rendicion_count" INTEGER NOT NULL,
  "paid_by_id" TEXT NOT NULL,
  "paid_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "finance_payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "finance_payments_code_key" ON "finance"."finance_payments"("code");
CREATE INDEX "idx_finance_payments_tenant" ON "finance"."finance_payments"("tenant_id");
CREATE INDEX "idx_finance_payments_code" ON "finance"."finance_payments"("code");

-- ── Trayectos / Kilometraje ──
CREATE TABLE "finance"."finance_trips" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "tenant_id" TEXT NOT NULL,
  "submitter_id" TEXT NOT NULL,
  "start_lat" DECIMAL(10,7) NOT NULL,
  "start_lng" DECIMAL(10,7) NOT NULL,
  "start_address" TEXT,
  "started_at" TIMESTAMPTZ(6) NOT NULL,
  "end_lat" DECIMAL(10,7),
  "end_lng" DECIMAL(10,7),
  "end_address" TEXT,
  "ended_at" TIMESTAMPTZ(6),
  "distance_km" DECIMAL(8,2),
  "liters_consumed" DECIMAL(8,2),
  "fuel_cost" INTEGER,
  "vehicle_fee" INTEGER,
  "subtotal" INTEGER,
  "toll_amount" INTEGER NOT NULL DEFAULT 0,
  "total_amount" INTEGER,
  "snapshot_km_per_liter" DECIMAL(6,2),
  "snapshot_fuel_price" INTEGER,
  "snapshot_fee_pct" DECIMAL(5,2),
  "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "finance_trips_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_finance_trips_tenant_submitter" ON "finance"."finance_trips"("tenant_id", "submitter_id");
CREATE INDEX "idx_finance_trips_status" ON "finance"."finance_trips"("status");

-- ── Rendiciones (entidad principal) ──
CREATE TABLE "finance"."finance_rendiciones" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "tenant_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "submitter_id" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'PURCHASE',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "amount" INTEGER NOT NULL DEFAULT 0,
  "date" DATE NOT NULL,
  "description" TEXT,
  "document_type" TEXT,
  "item_id" UUID,
  "trip_id" UUID,
  "cost_center_id" UUID,
  "payment_id" UUID,
  "paid_at" TIMESTAMPTZ(6),
  "payment_method" TEXT,
  "rejected_at" TIMESTAMPTZ(6),
  "rejection_reason" TEXT,
  "rejected_by_id" TEXT,
  "submitted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "finance_rendiciones_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "finance_rendiciones_code_key" ON "finance"."finance_rendiciones"("code");
CREATE UNIQUE INDEX "finance_rendiciones_trip_id_key" ON "finance"."finance_rendiciones"("trip_id");
CREATE INDEX "idx_finance_rendiciones_tenant_submitter" ON "finance"."finance_rendiciones"("tenant_id", "submitter_id");
CREATE INDEX "idx_finance_rendiciones_tenant_status" ON "finance"."finance_rendiciones"("tenant_id", "status");
CREATE INDEX "idx_finance_rendiciones_tenant_date" ON "finance"."finance_rendiciones"("tenant_id", "date");
CREATE INDEX "idx_finance_rendiciones_code" ON "finance"."finance_rendiciones"("code");

-- Foreign keys for rendiciones
ALTER TABLE "finance"."finance_rendiciones"
  ADD CONSTRAINT "fk_rendicion_item" FOREIGN KEY ("item_id") REFERENCES "finance"."finance_rendicion_items"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "fk_rendicion_trip" FOREIGN KEY ("trip_id") REFERENCES "finance"."finance_trips"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "fk_rendicion_cost_center" FOREIGN KEY ("cost_center_id") REFERENCES "finance"."finance_cost_centers"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "fk_rendicion_payment" FOREIGN KEY ("payment_id") REFERENCES "finance"."finance_payments"("id") ON DELETE SET NULL;

-- ── Historial de rendiciones ──
CREATE TABLE "finance"."finance_rendicion_history" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "rendicion_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "from_status" TEXT,
  "to_status" TEXT,
  "user_id" TEXT NOT NULL,
  "user_name" TEXT,
  "comment" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "finance_rendicion_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_history_rendicion" FOREIGN KEY ("rendicion_id") REFERENCES "finance"."finance_rendiciones"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_finance_history_rendicion" ON "finance"."finance_rendicion_history"("rendicion_id");
CREATE INDEX "idx_finance_history_created_desc" ON "finance"."finance_rendicion_history"("created_at" DESC);

-- ── Aprobaciones ──
CREATE TABLE "finance"."finance_approvals" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "rendicion_id" UUID NOT NULL,
  "approver_id" TEXT NOT NULL,
  "approval_order" INTEGER NOT NULL DEFAULT 1,
  "decision" TEXT,
  "comment" TEXT,
  "decided_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "finance_approvals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_approval_rendicion" FOREIGN KEY ("rendicion_id") REFERENCES "finance"."finance_rendiciones"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "uq_finance_approval_rendicion_approver" ON "finance"."finance_approvals"("rendicion_id", "approver_id");
CREATE INDEX "idx_finance_approvals_rendicion" ON "finance"."finance_approvals"("rendicion_id");
CREATE INDEX "idx_finance_approvals_approver" ON "finance"."finance_approvals"("approver_id");

-- ── Adjuntos ──
CREATE TABLE "finance"."finance_attachments" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "tenant_id" TEXT NOT NULL,
  "rendicion_id" UUID,
  "trip_id" UUID,
  "file_name" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "storage_key" TEXT NOT NULL,
  "public_url" TEXT NOT NULL,
  "attachment_type" TEXT NOT NULL DEFAULT 'OTHER',
  "uploaded_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "finance_attachments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_attachment_rendicion" FOREIGN KEY ("rendicion_id") REFERENCES "finance"."finance_rendiciones"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_attachment_trip" FOREIGN KEY ("trip_id") REFERENCES "finance"."finance_trips"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_finance_attachments_rendicion" ON "finance"."finance_attachments"("rendicion_id");
CREATE INDEX "idx_finance_attachments_trip" ON "finance"."finance_attachments"("trip_id");

-- Foreign key for payments -> tenants
ALTER TABLE "finance"."finance_payments"
  ADD CONSTRAINT "fk_payment_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE;

-- Foreign key for config -> tenants
ALTER TABLE "finance"."finance_rendicion_config"
  ADD CONSTRAINT "fk_config_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE;
